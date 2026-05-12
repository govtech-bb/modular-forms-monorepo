import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RegistryBuilderService } from "./registry-builder.service";
import { ValidateRecipeDto } from "./dto/validate-recipe.dto";
import { PreviewRecipeDto } from "./dto/preview-recipe.dto";
import { ApiResponse as AppApiResponse } from "../../common/response";
import type { ApiResponseShape } from "../../common/response";
import type {
  RegistryCatalog,
  PrimitiveRegistryItem,
  BlockRegistryItem,
  BuilderMetadata,
  RecipeValidateResponse,
} from "@govtech-bb/form-builder";
import type { ServiceContract } from "@govtech-bb/form-types";
import {
  GetCatalogDocs,
  GetPrimitivesDocs,
  GetPrimitiveByIdDocs,
  GetBlocksDocs,
  GetBlockByIdDocs,
  GetBuilderMetadataDocs,
  ValidateRecipeDocs,
  PreviewRecipeDocs,
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
