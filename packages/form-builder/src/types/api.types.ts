import type {
  ServiceContract,
  ServiceContractRecipe,
  ValidationIssue,
} from "@govtech-bb/form-types";
import type { RegistryCatalog, RegistryItem } from "./registry.types";
import type { BuilderMetadata } from "./metadata.types";

/**
 * API response body for `GET /builder/registry`.
 * Wrapped in the standard `ApiResponse` envelope on the wire.
 */
export interface RegistryCatalogResponse {
  data: RegistryCatalog;
}

/**
 * API response body for `GET /registry/items/:ref`.
 * Wrapped in the standard `ApiResponse` envelope on the wire.
 */
export interface RegistryItemResponse {
  data: RegistryItem;
}

/**
 * API response body for `GET /builder/metadata`.
 * Returns all static descriptor tables the builder UI needs.
 */
export interface BuilderMetadataResponse {
  data: BuilderMetadata;
}

/**
 * Request body for `POST /builder/validate`.
 * Accepts a raw recipe and returns validation issues without persisting.
 */
export interface RecipeValidateRequest {
  recipe: ServiceContractRecipe;
}

/**
 * Response body for `POST /builder/validate`.
 */
export interface RecipeValidateResponse {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Request body for `POST /builder/preview`.
 * Triggers a dry-run hydration of the recipe into a full `ServiceContract`.
 */
export interface RecipePreviewRequest {
  recipe: ServiceContractRecipe;
}

/**
 * Response body for `POST /builder/preview`.
 * Returns the fully-resolved `ServiceContract` for the given recipe.
 */
export type RecipePreviewResponse = ServiceContract;
