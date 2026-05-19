import { z } from "zod";
import { fieldOverridesSchema, primitiveSchema } from "./primitive.type";
import { behaviourSchema } from "./behavior.type";

export const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export const KEBAB_CASE_MESSAGE =
  'Step ID must be in kebab-case (e.g. "my-step")';

export const formStepSchema = z.object({
  stepId: z.string().regex(KEBAB_CASE_REGEX, KEBAB_CASE_MESSAGE),
  title: z.string(),
  description: z.string().optional(),
  elements: z.array(primitiveSchema),
  behaviours: z.array(behaviourSchema).optional(),
  nextSteps: z
    .array(
      z.object({
        title: z.string(),
        content: z.string().optional(),
        items: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});
export type FormStep = z.infer<typeof formStepSchema>;

export const recipeComponentFieldSchema = z.object({
  ref: z.string().regex(/^components\//),
  overrides: fieldOverridesSchema.optional(),
});
export type RecipeComponentField = z.infer<typeof recipeComponentFieldSchema>;

export const recipeBlockFieldSchema = z.object({
  ref: z.string().regex(/^blocks\//),
  overrides: z.record(z.string(), fieldOverridesSchema).optional(),
});
export type RecipeBlockField = z.infer<typeof recipeBlockFieldSchema>;

export const recipeFormStepFieldSchema = z.union([
  recipeComponentFieldSchema,
  recipeBlockFieldSchema,
]);
export type RecipeFormStepField = z.infer<typeof recipeFormStepFieldSchema>;

export const recipeFormStepSchema = formStepSchema
  .omit({ elements: true })
  .extend({
    elements: z.array(recipeFormStepFieldSchema),
  });
export type RecipeFormStep = z.infer<typeof recipeFormStepSchema>;
