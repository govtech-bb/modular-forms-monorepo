import { IsObject } from "class-validator";
import type { ServiceContractRecipe } from "@govtech-bb/form-types";

export class UpdateRecipeDto {
  @IsObject()
  recipe!: ServiceContractRecipe;
}
