import type {
  ServiceContractRecipe,
  ServiceContract,
} from "@govtech-bb/form-types";
import type {
  RegistryCatalog,
  RecipeValidateResponse,
} from "@govtech-bb/form-builder";
import { FormFetchError } from "./forms";
import type { ApiResponse } from "@web/types";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3001";

// ---------------------------------------------------------------------------
// Internal fetch helper (re-using the same envelope contract)
// ---------------------------------------------------------------------------

interface RegistryApiResponse<T> extends ApiResponse {
  data: T;
}

const registryFetch = async <T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new FormFetchError(
      "Unable to reach the server. Please check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? "Requested resource was not found."
        : `Request failed (HTTP ${response.status}).`;
    throw new FormFetchError(message, response.status);
  }

  const body = (await response.json()) as RegistryApiResponse<T>;

  if (body.status && body.status !== "success") {
    throw new FormFetchError(
      body.message ?? "The server returned an unexpected response.",
      500,
    );
  }

  return body.data;
};

// ---------------------------------------------------------------------------
// Payload construction — centralised so only one place needs updating if
// the API request shape changes.
// ---------------------------------------------------------------------------

/**
 * Build the POST body for the `POST /registry/recipes/preview` endpoint.
 * Extracted here so callers never inline the shape — update only this
 * function when the API contract changes.
 */
export function buildPreviewPayload(
  recipe: ServiceContractRecipe,
): Record<string, unknown> {
  return { data: recipe };
}

/**
 * Build the POST body for the `POST /registry/recipes/validate` endpoint.
 */
export function buildValidatePayload(
  recipe: ServiceContractRecipe,
): Record<string, unknown> {
  return { recipe };
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch the full registry catalog (primitives, blocks, custom components).
 * `GET /registry`
 */
export const fetchCatalog = (): Promise<RegistryCatalog> =>
  registryFetch<RegistryCatalog>("/registry");

/**
 * Validate a recipe against the registry without persisting.
 * `POST /registry/recipes/validate`
 */
export const validateRecipeApi = (
  recipe: ServiceContractRecipe,
): Promise<RecipeValidateResponse> =>
  registryFetch<RecipeValidateResponse>("/registry/recipes/validate", {
    method: "POST",
    body: JSON.stringify(buildValidatePayload(recipe)),
  });

/**
 * Hydrate a recipe into a full ServiceContract (dry-run preview).
 * `POST /registry/recipes/preview`
 */
export const previewRecipeApi = (
  recipe: ServiceContractRecipe,
): Promise<ServiceContract> =>
  registryFetch<ServiceContract>("/registry/recipes/preview", {
    method: "POST",
    body: JSON.stringify(buildPreviewPayload(recipe)),
  });
