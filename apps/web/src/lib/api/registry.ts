import type {
  ServiceContractRecipe,
  ServiceContract,
} from "@govtech-bb/form-types";
import type {
  RegistryCatalog,
  RecipeValidateResponse,
  RecipeSubmitResponse,
  RecipeUpdateResponse,
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
    let message: string;
    try {
      const errBody = (await response.json()) as { message?: string };
      message =
        errBody.message ??
        (response.status === 404
          ? "Requested resource was not found."
          : `Request failed (HTTP ${response.status}).`);
    } catch {
      message =
        response.status === 404
          ? "Requested resource was not found."
          : `Request failed (HTTP ${response.status}).`;
    }
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
  return { recipe };
}

/**
 * Build the POST body for the `POST /registry/recipes/validate` endpoint.
 */
export function buildValidatePayload(
  recipe: ServiceContractRecipe,
): Record<string, unknown> {
  return { recipe };
}

/**
 * Build the POST body for the `POST /registry/recipes/submit` endpoint.
 */
export function buildSubmitPayload(
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

/**
 * Submit a validated recipe to the registry, creating a persisted form definition.
 * `POST /registry/recipes/submit`
 */
export const submitRecipeApi = (
  recipe: ServiceContractRecipe,
): Promise<RecipeSubmitResponse> =>
  registryFetch<RecipeSubmitResponse>("/registry/recipes/submit", {
    method: "POST",
    body: JSON.stringify(buildSubmitPayload(recipe)),
  });

/**
 * Fetch the raw (un-hydrated) ServiceContractRecipe for an existing form.
 * `GET /form-definitions/:formId/recipe`
 */
export const fetchRecipeApi = (
  formId: string,
): Promise<ServiceContractRecipe> =>
  registryFetch<ServiceContractRecipe>(
    `/form-definitions/${encodeURIComponent(formId)}/recipe`,
  );

/**
 * Update (overwrite) the recipe for an existing form definition.
 * `PUT /registry/recipes/:formId`
 */
export const updateRecipeApi = (
  formId: string,
  recipe: ServiceContractRecipe,
): Promise<RecipeUpdateResponse> =>
  registryFetch<RecipeUpdateResponse>(
    `/registry/recipes/${encodeURIComponent(formId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ recipe }),
    },
  );

// ---------------------------------------------------------------------------
// Auto-versioning
// ---------------------------------------------------------------------------

export interface NextVersionResponse {
  formId: string;
  currentVersion: string | null;
  nextVersion: string;
}

/**
 * Fetch the next auto-computed version for a form.
 * New forms return `1.0.0`; existing forms return a patch-incremented version.
 * `GET /registry/recipes/:formId/next-version`
 */
export const fetchNextVersionApi = (
  formId: string,
): Promise<NextVersionResponse> =>
  registryFetch<NextVersionResponse>(
    `/registry/recipes/${encodeURIComponent(formId)}/next-version`,
  );
