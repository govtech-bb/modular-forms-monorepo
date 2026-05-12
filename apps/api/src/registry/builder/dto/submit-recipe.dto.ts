import { IsObject, IsString, MaxLength } from "class-validator";
import type { ServiceContractRecipe } from "@govtech-bb/form-types";

export class SubmitRecipeDto {
  @IsObject()
  recipe!: ServiceContractRecipe;

  @IsString()
  @MaxLength(100)
  formId!: string;

  @IsString()
  @MaxLength(20)
  version!: string;
}
