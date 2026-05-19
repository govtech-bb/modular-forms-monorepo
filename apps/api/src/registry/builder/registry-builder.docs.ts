import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";

export function GetCatalogDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Get the full registry catalog",
      description:
        "Returns all available primitives, blocks, and custom components " +
        "for use in the form builder palette.",
    }),
    ApiResponse({
      status: 200,
      description: "Registry catalog retrieved",
      schema: {
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string", example: "Registry catalog retrieved" },
          statusCode: { type: "number", example: 200 },
          data: {
            type: "object",
            description:
              "RegistryCatalog with primitives, blocks, and custom arrays",
          },
        },
      },
    }),
  );
}

export function GetPrimitivesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "List all primitive components",
      description:
        "Returns the full list of builtin primitive field components.",
    }),
    ApiResponse({ status: 200, description: "Primitives retrieved" }),
  );
}

export function GetPrimitiveByIdDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Get a single primitive by fieldId",
      description:
        "Returns the enriched descriptor for a single builtin primitive.",
    }),
    ApiParam({
      name: "fieldId",
      description: "The primitive fieldId",
      example: "first-name",
    }),
    ApiResponse({ status: 200, description: "Primitive retrieved" }),
    ApiNotFoundResponse({ description: "Primitive not found" }),
  );
}

export function GetBlocksDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "List all block components",
      description:
        "Returns the full list of builtin block components with their elements.",
    }),
    ApiResponse({ status: 200, description: "Blocks retrieved" }),
  );
}

export function GetBlockByIdDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Get a single block by blockId",
      description:
        "Returns the enriched descriptor for a single builtin block.",
    }),
    ApiParam({
      name: "blockId",
      description: "The block identifier",
      example: "personal-information",
    }),
    ApiResponse({ status: 200, description: "Block retrieved" }),
    ApiNotFoundResponse({ description: "Block not found" }),
  );
}

export function GetBuilderMetadataDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Get builder metadata",
      description:
        "Returns static descriptor tables for all validation rules, behaviour types, " +
        "and equality operators — used by the builder UI to render configuration panels.",
    }),
    ApiResponse({ status: 200, description: "Builder metadata retrieved" }),
  );
}

export function ValidateRecipeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Validate a service contract recipe",
      description:
        "Dry-runs Zod validation against the submitted recipe without persisting anything. " +
        "Returns a list of validation issues when invalid.",
    }),
    ApiBody({
      schema: {
        type: "object",
        required: ["recipe"],
        properties: {
          recipe: {
            type: "object",
            description: "ServiceContractRecipe to validate",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Validation result",
      schema: {
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string" },
          statusCode: { type: "number", example: 200 },
          data: {
            type: "object",
            properties: {
              valid: { type: "boolean" },
              issues: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    }),
  );
}

export function GetRegistryItemDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Get a single registry item by ref",
      description:
        "Returns the enriched descriptor for any registry ref — primitive, block, or custom component.",
    }),
    ApiQuery({
      name: "ref",
      description:
        "Full registry ref (e.g. components/first-name, blocks/personal-information)",
      example: "components/first-name",
    }),
    ApiResponse({ status: 200, description: "Registry item retrieved" }),
    ApiNotFoundResponse({ description: "Registry item not found" }),
  );
}

export function SubmitRecipeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Submit a recipe and persist it as a form definition",
      description:
        "Validates the recipe with Zod, checks for a duplicate formId+version pair, " +
        "then persists a new FormDefinitionEntity with publishedAt = null.",
    }),
    ApiBody({
      schema: {
        type: "object",
        required: ["recipe"],
        properties: {
          recipe: {
            type: "object",
            description:
              "ServiceContractRecipe to validate and store. formId and version are read from the recipe itself.",
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Recipe persisted as a new form definition",
      schema: {
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string", example: "Recipe submitted successfully" },
          statusCode: { type: "number", example: 201 },
          data: {
            type: "object",
            description: "Saved FormDefinitionEntity",
            properties: {
              id: { type: "string", format: "uuid" },
              formId: { type: "string" },
              version: { type: "string" },
              schema: { type: "object" },
              publishedAt: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Recipe failed Zod validation",
    }),
    ApiConflictResponse({
      description:
        "A form definition with the same formId and version already exists",
    }),
  );
}

export function UpdateRecipeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Update an existing recipe in-place",
      description:
        "Validates the recipe with Zod, asserts the URL formId matches the recipe formId, " +
        "then overwrites the stored schema for the matching formId+version row. " +
        "Returns 400 if formId mismatches, 404 if the formId+version pair does not exist, " +
        "and 409 if the form definition has already been published.",
    }),
    ApiParam({
      name: "formId",
      description: "The formId of the existing form definition to update",
      example: "apply-for-passport",
    }),
    ApiBody({
      schema: {
        type: "object",
        required: ["recipe"],
        properties: {
          recipe: {
            type: "object",
            description:
              "ServiceContractRecipe to validate and store. formId and version must match the existing record.",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Recipe updated successfully",
      schema: {
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string", example: "Recipe updated successfully" },
          statusCode: { type: "number", example: 200 },
          data: {
            type: "object",
            description: "Updated FormDefinitionEntity",
            properties: {
              id: { type: "string", format: "uuid" },
              formId: { type: "string" },
              version: { type: "string" },
              schema: { type: "object" },
              publishedAt: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        "Recipe failed Zod validation or formId in URL does not match recipe formId",
    }),
    ApiNotFoundResponse({
      description: "No form definition found for the given formId+version",
    }),
    ApiConflictResponse({
      description: "Form definition is published and cannot be modified",
    }),
  );
}

export function PreviewRecipeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Preview a hydrated service contract",
      description:
        "Resolves all component refs in a recipe into a full ServiceContract without persisting. " +
        "Returns 400 if any ref cannot be resolved.",
    }),
    ApiBody({
      schema: {
        type: "object",
        required: ["recipe"],
        properties: {
          recipe: {
            type: "object",
            description: "ServiceContractRecipe to hydrate",
          },
        },
      },
    }),
    ApiResponse({ status: 200, description: "Hydrated ServiceContract" }),
    ApiResponse({
      status: 400,
      description: "Unresolvable component ref in recipe",
    }),
  );
}

export function GetNextVersionDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Compute the next SemVer for a form",
      description:
        "Inspects all persisted versions for the given formId and returns the next minor-incremented " +
        "version string (patch reset to 0). Returns nextVersion: '1.0.0' for an unknown formId. Never returns an error " +
        "for an unrecognised formId — callers can use this unconditionally when saving a new form.",
    }),
    ApiParam({
      name: "formId",
      description: "The formId to compute the next version for",
      example: "apply-for-passport",
    }),
    ApiResponse({
      status: 200,
      description: "Next version computed",
      schema: {
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string", example: "Next version computed" },
          statusCode: { type: "number", example: 200 },
          data: {
            type: "object",
            properties: {
              formId: { type: "string", example: "apply-for-passport" },
              currentVersion: {
                type: "string",
                nullable: true,
                example: "1.0.0",
              },
              nextVersion: { type: "string", example: "1.1.0" },
            },
          },
        },
      },
    }),
  );
}
