import { IsObject } from "class-validator";
import type { ServiceContractRecipe } from "@govtech-bb/form-types";

export class PreviewRecipeDto {
  @IsObject()
  recipe!: ServiceContractRecipe;
}
