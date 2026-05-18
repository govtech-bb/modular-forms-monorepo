import { applyDecorators } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";

export function GetFormDefinitionDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Get a form definition",
      description:
        "Returns the hydrated form definition for the given formId. " +
        "Defaults to the latest version when no version is specified.",
    }),
    ApiParam({
      name: "formId",
      description: "The unique form identifier",
      example: "passport-renewal",
    }),
    ApiQuery({
      name: "version",
      required: false,
      description: "Specific form version to retrieve",
      example: "1.0.0",
    }),
    ApiResponse({
      status: 200,
      description: "Form definition retrieved",
      schema: {
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string", example: "Form definition retrieved" },
          statusCode: { type: "number", example: 200 },
          data: {
            type: "object",
            description:
              "Hydrated ServiceContract containing steps, processors, and metadata",
          },
        },
      },
    }),
    ApiNotFoundResponse({ description: "Form definition not found" }),
  );
}

export function GetFormRecipeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: "Get the raw form recipe",
      description:
        "Returns the un-hydrated ServiceContractRecipe for the given formId. " +
        "Component ref strings are preserved as-is (not inlined). " +
        "Defaults to the latest version when no version is specified.",
    }),
    ApiParam({
      name: "formId",
      description: "The unique form identifier",
      example: "passport-renewal",
    }),
    ApiResponse({
      status: 200,
      description: "Form recipe retrieved",
      schema: {
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string", example: "Form recipe retrieved" },
          statusCode: { type: "number", example: 200 },
          data: {
            type: "object",
            description: "Raw ServiceContractRecipe with ref strings intact",
          },
        },
      },
    }),
    ApiNotFoundResponse({ description: "Form definition not found" }),
  );
}
