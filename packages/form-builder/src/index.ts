// ---------------------------------------------------------------------------
// Types — registry
// ---------------------------------------------------------------------------
export type {
  PrimitiveRegistryItem,
  BlockRegistryItem,
  CustomRegistryItem,
  RegistryItem,
  RegistryCatalog,
} from "./types/registry.types";

// ---------------------------------------------------------------------------
// Types — builder draft
// ---------------------------------------------------------------------------
export type {
  RecipeFieldDraft,
  RecipeStepDraft,
  RecipeDraft,
  RecipeDraftAction,
} from "./types/builder.types";

// ---------------------------------------------------------------------------
// Types — metadata descriptors
// ---------------------------------------------------------------------------
export type {
  ValidationParamKey,
  ValidationParamInputType,
  ValidationRuleParam,
  ValidationRuleDescriptor,
  BehaviourParamInputType,
  BehaviourParam,
  BehaviourTypeDescriptor,
  BuilderMetadata,
} from "./types/metadata.types";

// ---------------------------------------------------------------------------
// Types — API envelopes
// ---------------------------------------------------------------------------
export type {
  RegistryCatalogResponse,
  RegistryItemResponse,
  BuilderMetadataResponse,
  RecipeValidateRequest,
  RecipeValidateResponse,
  RecipePreviewRequest,
  RecipePreviewResponse,
} from "./types/api.types";

// ---------------------------------------------------------------------------
// Schemas — runtime validation
// ---------------------------------------------------------------------------
export {
  recipeFieldDraftSchema,
  recipeStepDraftSchema,
  recipeDraftSchema,
} from "./schemas/recipe-draft.schema";

export type {
  RecipeFieldDraftSchema,
  RecipeStepDraftSchema,
  RecipeDraftSchema,
} from "./schemas/recipe-draft.schema";

// ---------------------------------------------------------------------------
// Constants — validation metadata
// ---------------------------------------------------------------------------
export {
  VALIDATION_RULE_DESCRIPTORS,
  getValidationDescriptor,
} from "./constants/validation-metadata";

// ---------------------------------------------------------------------------
// Constants — behaviour metadata
// ---------------------------------------------------------------------------
export {
  BEHAVIOUR_TYPE_DESCRIPTORS,
  getBehaviourDescriptor,
  EQUALITY_OPERATOR_OPTIONS,
} from "./constants/behaviour-metadata";

// ---------------------------------------------------------------------------
// Utils — ref parsing and construction
// ---------------------------------------------------------------------------
export {
  parseRef,
  buildComponentRef,
  buildBlockRef,
  buildCustomRef,
  isBlockRef,
  isComponentRef,
  isCustomRef,
  refLabel,
} from "./utils/ref";

export type { ParsedRef } from "./utils/ref";

// ---------------------------------------------------------------------------
// Utils — draft / contract serialization
// ---------------------------------------------------------------------------
export { serializeRecipeDraft, deserializeRecipe } from "./utils/serialization";
