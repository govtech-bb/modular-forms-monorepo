/**
 * Utilities for working with registry ref strings.
 *
 * Ref format conventions:
 * - Builtin component: `"components/<fieldId>"` (e.g. `"components/first-name"`)
 * - Builtin block:     `"blocks/<blockId>"` (e.g. `"blocks/personal-information"`)
 * - Custom component:  `"components/<namespace>/<type>"` (e.g. `"components/barbados/next-of-kin"`)
 *
 * A ref is considered "custom" when the `components/` prefix is followed by
 * more than one path segment (i.e. it has an additional namespace segment).
 */

/** Discriminated union of all parsed ref shapes. */
export type ParsedRef =
  | { kind: "component"; fieldId: string }
  | { kind: "block"; blockId: string }
  | { kind: "custom"; namespace: string; type: string };

/**
 * Parse a registry ref string into its constituent parts.
 *
 * @example
 * parseRef("components/first-name")
 * // → { kind: "component", fieldId: "first-name" }
 *
 * parseRef("blocks/personal-information")
 * // → { kind: "block", blockId: "personal-information" }
 *
 * parseRef("components/barbados/next-of-kin")
 * // → { kind: "custom", namespace: "barbados", type: "next-of-kin" }
 *
 * @throws {Error} When the ref does not match any known pattern.
 */
export function parseRef(ref: string): ParsedRef {
  if (ref.startsWith("blocks/")) {
    const blockId = ref.slice("blocks/".length);
    if (!blockId) {
      throw new Error(`Invalid block ref: "${ref}" — blockId is empty`);
    }
    return { kind: "block", blockId };
  }

  if (ref.startsWith("components/")) {
    const rest = ref.slice("components/".length);
    if (!rest) {
      throw new Error(
        `Invalid component ref: "${ref}" — component path is empty`,
      );
    }
    const slashIndex = rest.indexOf("/");
    if (slashIndex === -1) {
      // Builtin: "components/first-name"
      return { kind: "component", fieldId: rest };
    }
    // Custom: "components/barbados/next-of-kin"
    const namespace = rest.slice(0, slashIndex);
    const type = rest.slice(slashIndex + 1);
    if (!namespace || !type) {
      throw new Error(
        `Invalid custom ref: "${ref}" — namespace or type is empty`,
      );
    }
    return { kind: "custom", namespace, type };
  }

  throw new Error(
    `Unrecognised ref format: "${ref}" — must start with "components/" or "blocks/"`,
  );
}

/**
 * Build a builtin component ref from a field ID.
 *
 * @example buildComponentRef("first-name") → "components/first-name"
 */
export function buildComponentRef(fieldId: string): string {
  return `components/${fieldId}`;
}

/**
 * Build a block ref from a block ID.
 *
 * @example buildBlockRef("personal-information") → "blocks/personal-information"
 */
export function buildBlockRef(blockId: string): string {
  return `blocks/${blockId}`;
}

/**
 * Build a custom (namespaced) component ref.
 *
 * @example buildCustomRef("barbados", "next-of-kin") → "components/barbados/next-of-kin"
 */
export function buildCustomRef(namespace: string, type: string): string {
  return `components/${namespace}/${type}`;
}

/**
 * Returns `true` when the ref is a block ref (`blocks/...`).
 */
export function isBlockRef(ref: string): boolean {
  return ref.startsWith("blocks/");
}

/**
 * Returns `true` when the ref is a builtin component ref (`components/<single-segment>`).
 * Returns `false` for custom (namespaced) refs.
 */
export function isComponentRef(ref: string): boolean {
  if (!ref.startsWith("components/")) return false;
  const rest = ref.slice("components/".length);
  return rest.length > 0 && !rest.includes("/");
}

/**
 * Returns `true` when the ref is a custom (namespaced) component ref
 * (`components/<namespace>/<type>`).
 */
export function isCustomRef(ref: string): boolean {
  if (!ref.startsWith("components/")) return false;
  const rest = ref.slice("components/".length);
  return rest.includes("/");
}

/**
 * Extract the final path segment from a ref string.
 *
 * @example
 * refLabel("components/first-name")       → "first-name"
 * refLabel("blocks/personal-information") → "personal-information"
 * refLabel("components/barbados/next-of-kin") → "next-of-kin"
 */
export function refLabel(ref: string): string {
  const parts = ref.split("/");
  return parts[parts.length - 1] ?? ref;
}
