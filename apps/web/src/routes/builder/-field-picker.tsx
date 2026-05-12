import React from "react";
import type {
  RegistryCatalog,
  PrimitiveRegistryItem,
  BlockRegistryItem,
  RecipeFieldDraft,
} from "@govtech-bb/form-builder";
import { makeFieldId } from "./-recipe-reducer";
import css from "../../styles/builder.module.css";

type PaletteTab = "components" | "blocks";

interface FieldPickerProps {
  catalog: RegistryCatalog;
  onAddField: (field: RecipeFieldDraft) => void;
}

export function FieldPicker({ catalog, onAddField }: FieldPickerProps) {
  const [tab, setTab] = React.useState<PaletteTab>("components");
  const [search, setSearch] = React.useState("");

  const query = search.trim().toLowerCase();

  const filteredPrimitives: PrimitiveRegistryItem[] = catalog.primitives.filter(
    (p) =>
      !query ||
      p.label.toLowerCase().includes(query) ||
      p.fieldId.toLowerCase().includes(query),
  );

  const filteredBlocks: BlockRegistryItem[] = catalog.blocks.filter(
    (b) =>
      !query ||
      b.label.toLowerCase().includes(query) ||
      b.blockId.toLowerCase().includes(query),
  );

  const handleAddComponent = (item: PrimitiveRegistryItem) => {
    const field: RecipeFieldDraft = {
      _id: makeFieldId(),
      ref: item.ref,
      kind: "component",
      overrides: {},
    };
    onAddField(field);
  };

  const handleAddBlock = (item: BlockRegistryItem) => {
    const field: RecipeFieldDraft = {
      _id: makeFieldId(),
      ref: item.ref,
      kind: "block",
      overrides: {},
    };
    onAddField(field);
  };

  return (
    <div className={css.paletteRoot}>
      <input
        type="search"
        className={css.paletteSearch}
        placeholder="Search components..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search palette"
      />

      <div className={css.paletteTabs} role="tablist">
        <button
          role="tab"
          type="button"
          aria-selected={tab === "components"}
          className={`${css.paletteTab} ${
            tab === "components" ? css.paletteTabActive : ""
          }`}
          onClick={() => setTab("components")}
        >
          Components ({filteredPrimitives.length})
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "blocks"}
          className={`${css.paletteTab} ${
            tab === "blocks" ? css.paletteTabActive : ""
          }`}
          onClick={() => setTab("blocks")}
        >
          Blocks ({filteredBlocks.length})
        </button>
      </div>

      <div className={css.paletteList} role="list">
        {tab === "components" &&
          (filteredPrimitives.length === 0 ? (
            <p className={css.paletteEmpty}>No components match your search.</p>
          ) : (
            filteredPrimitives.map((item) => (
              <button
                key={item.ref}
                type="button"
                role="listitem"
                className={css.paletteItem}
                onClick={() => handleAddComponent(item)}
                title={`Add ${item.label}`}
              >
                <span className={css.paletteItemLabel}>{item.label}</span>
                <span className={css.paletteItemMeta}>
                  {item.htmlType} &middot; {item.fieldId}
                </span>
              </button>
            ))
          ))}

        {tab === "blocks" &&
          (filteredBlocks.length === 0 ? (
            <p className={css.paletteEmpty}>No blocks match your search.</p>
          ) : (
            filteredBlocks.map((item) => (
              <button
                key={item.ref}
                type="button"
                role="listitem"
                className={css.paletteItem}
                onClick={() => handleAddBlock(item)}
                title={`Add block: ${item.label}`}
              >
                <span className={css.paletteItemLabel}>{item.label}</span>
                <span className={css.paletteItemMeta}>
                  block &middot; {item.blockId} &middot; v{item.version}
                </span>
              </button>
            ))
          ))}
      </div>
    </div>
  );
}
