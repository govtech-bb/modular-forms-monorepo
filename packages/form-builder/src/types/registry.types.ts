import type { HtmlTypes, Primitive, Block } from "@govtech-bb/form-types";

/**
 * A builtin or custom component from the registry, enriched for UI display.
 * Consumers can use `hasOptions` to decide whether to render an options editor.
 */
export interface PrimitiveRegistryItem {
  /** Fully-qualified registry key, e.g. "components/first-name" */
  ref: string;
  kind: "primitive";
  fieldId: string;
  label: string;
  htmlType: HtmlTypes;
  /** True for checkbox | radio | select — these fields have an options array. */
  hasOptions: boolean;
  defaultDefinition: Primitive;
}

/**
 * A builtin block from the registry, enriched for UI display.
 * `elements` holds enriched descriptors for each primitive inside the block.
 */
export interface BlockRegistryItem {
  /** Fully-qualified registry key, e.g. "blocks/personal-information" */
  ref: string;
  kind: "block";
  blockId: string;
  /** Derived from `Block.blockDescription`. */
  label: string;
  version: string;
  elements: PrimitiveRegistryItem[];
  defaultDefinition: Block;
}

/**
 * A namespace-scoped custom component (org-specific, DB-backed).
 * Extends `PrimitiveRegistryItem` but carries namespace/type metadata.
 */
export interface CustomRegistryItem extends Omit<
  PrimitiveRegistryItem,
  "kind"
> {
  kind: "custom";
  /** The org/namespace segment, e.g. "barbados". */
  namespace: string;
  /** The component type within that namespace, e.g. "next-of-kin". */
  type: string;
}

/** Discriminated union of all registry item shapes. */
export type RegistryItem =
  | PrimitiveRegistryItem
  | BlockRegistryItem
  | CustomRegistryItem;

/**
 * Full registry catalog returned by the API.
 * The frontend renders the palette from this structure.
 */
export interface RegistryCatalog {
  primitives: PrimitiveRegistryItem[];
  blocks: BlockRegistryItem[];
  custom: CustomRegistryItem[];
}
