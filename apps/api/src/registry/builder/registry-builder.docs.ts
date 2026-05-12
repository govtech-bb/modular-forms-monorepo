import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
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
    ApiParam({
      name: "ref",
      description: "Full registry ref, URL-encoded",
      example: "components/first-name",
    }),
    ApiResponse({ status: 200, description: "Registry item retrieved" }),
    ApiNotFoundResponse({ description: "Registry item not found" }),
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
