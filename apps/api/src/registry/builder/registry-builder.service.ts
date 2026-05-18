import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { Primitive, Block, ServiceContract } from "@govtech-bb/form-types";
import { validateFormContract } from "@govtech-bb/form-types";
import type {
  RegistryCatalog,
  PrimitiveRegistryItem,
  BlockRegistryItem,
  CustomRegistryItem,
  RegistryItem,
  BuilderMetadata,
  RecipeValidateRequest,
  RecipeValidateResponse,
} from "@govtech-bb/form-builder";
import {
  VALIDATION_RULE_DESCRIPTORS,
  BEHAVIOUR_TYPE_DESCRIPTORS,
  EQUALITY_OPERATOR_OPTIONS,
  isCustomRef,
  parseRef,
} from "@govtech-bb/form-builder";
import {
  RegistryService,
  UnresolvableComponentError,
} from "../registry.service";
import { BUILTIN_REGISTRY, RegistryEntry } from "../builtins";
import { CustomComponent } from "../entities/custom-component.entity";
import { PreviewRecipeDto } from "./dto/preview-recipe.dto";
import { SubmitRecipeDto } from "./dto/submit-recipe.dto";
import { UpdateRecipeDto } from "./dto/update-recipe.dto";
import { FormDefinitionEntity } from "../../database/entities/form-definition.entity";
import { FormDefinitionRepository } from "../../forms/form-definitions/form-definition.repository";

const OPTIONS_HTML_TYPES = new Set(["checkbox", "radio", "select"]);

function isPrimitive(entry: RegistryEntry): entry is Primitive {
  return "fieldId" in entry && !("blockId" in entry);
}

function isBlock(entry: RegistryEntry): entry is Block {
  return "blockId" in entry;
}

function mapPrimitive(primitive: Primitive): PrimitiveRegistryItem {
  return {
    ref: `components/${primitive.fieldId}`,
    kind: "primitive",
    fieldId: primitive.fieldId,
    label: primitive.label,
    htmlType: primitive.htmlType,
    hasOptions: OPTIONS_HTML_TYPES.has(primitive.htmlType),
    defaultDefinition: primitive,
  };
}

function mapBlock(block: Block): BlockRegistryItem {
  return {
    ref: `blocks/${block.blockId}`,
    kind: "block",
    blockId: block.blockId,
    label: block.blockDescription,
    version: block.blockVersion,
    elements: block.elements.map(mapPrimitive),
    defaultDefinition: block,
  };
}

function mapCustomComponent(custom: CustomComponent): CustomRegistryItem {
  const definition = custom.definition as Primitive;
  return {
    ref: `components/${custom.namespace}/${custom.type}`,
    kind: "custom",
    fieldId: `${custom.namespace}/${custom.type}`,
    label: definition.label ?? custom.type,
    htmlType: definition.htmlType,
    hasOptions: OPTIONS_HTML_TYPES.has(definition.htmlType),
    defaultDefinition: definition,
    namespace: custom.namespace,
    type: custom.type,
  };
}

@Injectable()
export class RegistryBuilderService {
  private readonly logger = new Logger(RegistryBuilderService.name);

  private readonly builtinEntries: ReadonlyArray<[string, RegistryEntry]> =
    Object.entries(BUILTIN_REGISTRY);

  constructor(
    private readonly registryService: RegistryService,
    @InjectRepository(CustomComponent)
    private readonly customComponentRepo: Repository<CustomComponent>,
    private readonly formDefinitionRepository: FormDefinitionRepository,
  ) {}

  async getCatalog(): Promise<RegistryCatalog> {
    const primitives: PrimitiveRegistryItem[] = [];
    const blocks: BlockRegistryItem[] = [];

    for (const [, entry] of this.builtinEntries) {
      if (isBlock(entry)) {
        blocks.push(mapBlock(entry));
      } else if (isPrimitive(entry)) {
        primitives.push(mapPrimitive(entry));
      }
    }

    const customEntities = await this.customComponentRepo.find();
    const custom: CustomRegistryItem[] = customEntities.map(mapCustomComponent);

    this.logger.debug(
      `Catalog built: ${primitives.length} primitives, ${blocks.length} blocks, ${custom.length} custom`,
    );

    return { primitives, blocks, custom };
  }

  getPrimitives(): PrimitiveRegistryItem[] {
    const primitives: PrimitiveRegistryItem[] = [];
    for (const [, entry] of this.builtinEntries) {
      if (isPrimitive(entry)) {
        primitives.push(mapPrimitive(entry));
      }
    }
    return primitives;
  }

  getPrimitiveByFieldId(fieldId: string): PrimitiveRegistryItem {
    const ref = `components/${fieldId}`;
    const entry = BUILTIN_REGISTRY[ref];

    if (!entry || !isPrimitive(entry)) {
      throw new NotFoundException(`Primitive '${fieldId}' not found`);
    }

    return mapPrimitive(entry);
  }

  getBlocks(): BlockRegistryItem[] {
    const blocks: BlockRegistryItem[] = [];
    for (const [, entry] of this.builtinEntries) {
      if (isBlock(entry)) {
        blocks.push(mapBlock(entry));
      }
    }
    return blocks;
  }

  getBlockById(blockId: string): BlockRegistryItem {
    const ref = `blocks/${blockId}`;
    const entry = BUILTIN_REGISTRY[ref];

    if (!entry || !isBlock(entry)) {
      throw new NotFoundException(`Block '${blockId}' not found`);
    }

    return mapBlock(entry);
  }

  async getItem(ref: string): Promise<RegistryItem> {
    if (isCustomRef(ref)) {
      const parsed = parseRef(ref);
      if (parsed.kind !== "custom") {
        throw new NotFoundException(`Registry item '${ref}' not found`);
      }
      const entity = await this.customComponentRepo.findOne({
        where: { namespace: parsed.namespace, type: parsed.type },
      });
      if (!entity) {
        throw new NotFoundException(`Registry item '${ref}' not found`);
      }
      return mapCustomComponent(entity);
    }

    const entry = await this.registryService.resolve(ref);

    if (!entry) {
      throw new NotFoundException(`Registry item '${ref}' not found`);
    }

    if (isBlock(entry)) {
      return mapBlock(entry);
    }

    return mapPrimitive(entry as Primitive);
  }

  getBuilderMetadata(): BuilderMetadata {
    return {
      validationRules: VALIDATION_RULE_DESCRIPTORS,
      behaviourTypes: BEHAVIOUR_TYPE_DESCRIPTORS,
      equalityOperators: EQUALITY_OPERATOR_OPTIONS,
    };
  }

  validateRecipe(body: RecipeValidateRequest): RecipeValidateResponse {
    const result = validateFormContract(body.recipe);

    if (result.ok) {
      return { valid: true, issues: [] };
    }

    return { valid: false, issues: result.issues };
  }

  async submitRecipe(body: SubmitRecipeDto): Promise<FormDefinitionEntity> {
    const result = validateFormContract(body.recipe);

    if (!result.ok) {
      throw new BadRequestException({
        message: "Recipe validation failed",
        issues: result.issues,
      });
    }

    const { formId, version } = result.data;

    const existing = await this.formDefinitionRepository.findOne({
      where: { formId, version },
    });

    if (existing) {
      throw new ConflictException(
        `A form definition with formId '${formId}' and version '${version}' already exists`,
      );
    }

    const entity = this.formDefinitionRepository.create({
      formId,
      version,
      schema: body.recipe,
      publishedAt: null,
    });

    const saved = await this.formDefinitionRepository.save(entity);

    this.logger.log(
      `Recipe submitted: formId=${formId} version=${version} id=${saved.id}`,
    );

    return saved;
  }

  async updateRecipe(
    formId: string,
    body: UpdateRecipeDto,
  ): Promise<FormDefinitionEntity> {
    const result = validateFormContract(body.recipe);

    if (!result.ok) {
      throw new BadRequestException({
        message: "Recipe validation failed",
        issues: result.issues,
      });
    }

    if (formId !== result.data.formId) {
      throw new BadRequestException(
        "formId in URL does not match recipe formId",
      );
    }

    const { version } = result.data;

    const entity = await this.formDefinitionRepository.findOne({
      where: { formId, version },
    });

    if (!entity) {
      throw new NotFoundException(
        `Form definition not found: formId=${formId}, version=${version}`,
      );
    }

    if (entity.publishedAt !== null) {
      throw new ConflictException(
        `Form definition '${formId}' version '${version}' is published and cannot be modified`,
      );
    }

    entity.schema = body.recipe;
    const saved = await this.formDefinitionRepository.save(entity);

    this.logger.log(
      `Recipe updated: formId=${formId} version=${version} id=${saved.id}`,
    );

    return saved;
  }

  async previewRecipe(body: PreviewRecipeDto): Promise<ServiceContract> {
    try {
      return await this.registryService.hydrateForm(body.recipe);
    } catch (err) {
      if (err instanceof UnresolvableComponentError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}
