import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { FormDefinitionsService } from "./form-definitions.service";
import {
  GetFormDefinitionDocs,
  GetFormRecipeDocs,
} from "./form-definitions.docs";
import { ApiResponse as AppApiResponse } from "../../common/response";
import type { ApiResponseShape } from "../../common/response";
import type {
  ServiceContract,
  ServiceContractRecipe,
} from "@govtech-bb/form-types";

@ApiTags("Form Definitions")
@ApiBearerAuth()
@Controller("form-definitions")
export class FormDefinitionsController {
  constructor(
    private readonly formDefinitionsService: FormDefinitionsService,
  ) {}

  @Get()
  async getAll(): Promise<
    ApiResponseShape<{ formId: string; title: string }[]>
  > {
    const data = await this.formDefinitionsService.findAll();
    return AppApiResponse.success(data, {
      message: "Form definitions retrieved",
    });
  }

  @Get(":formId/recipe")
  @GetFormRecipeDocs()
  async getRecipe(
    @Param("formId") formId: string,
  ): Promise<ApiResponseShape<ServiceContractRecipe>> {
    const data = await this.formDefinitionsService.getRecipeByFormId(formId);
    return AppApiResponse.success(data, {
      message: "Form recipe retrieved",
    });
  }

  @Get(":formId")
  @GetFormDefinitionDocs()
  async get(
    @Param("formId") formId: string,
    @Query("version") version?: string,
  ): Promise<ApiResponseShape<ServiceContract>> {
    const data = await this.formDefinitionsService.findByFormId({
      formId,
      version,
    });
    return AppApiResponse.success(data, {
      message: "Form definition retrieved",
    });
  }
}
