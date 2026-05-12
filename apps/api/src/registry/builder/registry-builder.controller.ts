import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RegistryBuilderService } from "./registry-builder.service";
import { ValidateRecipeDto } from "./dto/validate-recipe.dto";
import { PreviewRecipeDto } from "./dto/preview-recipe.dto";
import { SubmitRecipeDto } from "./dto/submit-recipe.dto";
import { ApiResponse as AppApiResponse } from "../../common/response";
import type { ApiResponseShape } from "../../common/response";
import type {
  RegistryCatalog,
  PrimitiveRegistryItem,
  BlockRegistryItem,
  BuilderMetadata,
  RecipeValidateResponse,
  RegistryItem,
} from "@govtech-bb/form-builder";
import type { ServiceContract } from "@govtech-bb/form-types";
import type { FormDefinitionEntity } from "../../database/entities/form-definition.entity";
import {
  GetCatalogDocs,
  GetPrimitivesDocs,
  GetPrimitiveByIdDocs,
  GetBlocksDocs,
  GetBlockByIdDocs,
  GetBuilderMetadataDocs,
  GetRegistryItemDocs,
  ValidateRecipeDocs,
  PreviewRecipeDocs,
  SubmitRecipeDocs,
} from "./registry-builder.docs";

@ApiTags("Registry Builder")
@ApiBearerAuth()
@Controller("registry")
export class RegistryBuilderController {
  constructor(
    private readonly registryBuilderService: RegistryBuilderService,
  ) {}

  @Get()
  @GetCatalogDocs()
  async getCatalog(): Promise<ApiResponseShape<RegistryCatalog>> {
    const data = await this.registryBuilderService.getCatalog();
    return AppApiResponse.success(data, {
      message: "Registry catalog retrieved",
    });
  }

  @Get("primitives")
  @GetPrimitivesDocs()
  getPrimitives(): ApiResponseShape<PrimitiveRegistryItem[]> {
    const data = this.registryBuilderService.getPrimitives();
    return AppApiResponse.success(data, { message: "Primitives retrieved" });
  }

  @Get("primitives/:fieldId")
  @GetPrimitiveByIdDocs()
  getPrimitive(
    @Param("fieldId") fieldId: string,
  ): ApiResponseShape<PrimitiveRegistryItem> {
    const data = this.registryBuilderService.getPrimitiveByFieldId(fieldId);
    return AppApiResponse.success(data, { message: "Primitive retrieved" });
  }

  @Get("blocks")
  @GetBlocksDocs()
  getBlocks(): ApiResponseShape<BlockRegistryItem[]> {
    const data = this.registryBuilderService.getBlocks();
    return AppApiResponse.success(data, { message: "Blocks retrieved" });
  }

  @Get("blocks/:blockId")
  @GetBlockByIdDocs()
  getBlock(
    @Param("blockId") blockId: string,
  ): ApiResponseShape<BlockRegistryItem> {
    const data = this.registryBuilderService.getBlockById(blockId);
    return AppApiResponse.success(data, { message: "Block retrieved" });
  }

  @Get("metadata")
  @GetBuilderMetadataDocs()
  getBuilderMetadata(): ApiResponseShape<BuilderMetadata> {
    const data = this.registryBuilderService.getBuilderMetadata();
    return AppApiResponse.success(data, {
      message: "Builder metadata retrieved",
    });
  }

  @Get("items/:ref")
  @GetRegistryItemDocs()
  async getRegistryItem(
    @Param("ref") ref: string,
  ): Promise<ApiResponseShape<RegistryItem>> {
    const data = await this.registryBuilderService.getItem(ref);
    return AppApiResponse.success(data, { message: "Registry item retrieved" });
  }

  @Post("recipes/submit")
  @HttpCode(201)
  @SubmitRecipeDocs()
  async submitRecipe(
    @Body() body: SubmitRecipeDto,
  ): Promise<ApiResponseShape<FormDefinitionEntity>> {
    const data = await this.registryBuilderService.submitRecipe(body);
    return AppApiResponse.success(data, {
      message: "Recipe submitted successfully",
      statusCode: 201,
    });
  }

  @Post("recipes/validate")
  @ValidateRecipeDocs()
  validateRecipe(
    @Body() body: ValidateRecipeDto,
  ): ApiResponseShape<RecipeValidateResponse> {
    const data = this.registryBuilderService.validateRecipe(body);
    return AppApiResponse.success(data, {
      message: "Recipe validation complete",
    });
  }

  @Post("recipes/preview")
  @PreviewRecipeDocs()
  async previewRecipe(
    @Body() body: PreviewRecipeDto,
  ): Promise<ApiResponseShape<ServiceContract>> {
    const data = await this.registryBuilderService.previewRecipe(body);
    return AppApiResponse.success(data, {
      message: "Recipe preview generated",
    });
  }
}
