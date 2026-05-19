# Form Builder App Extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the form builder UI from `apps/web` into a standalone `apps/form_builder` Vite + React 19 + TanStack Router application on port 3002, removing the `/builder` route from `apps/web` entirely.

**Architecture:** A lean Vite app in the existing empty `apps/form_builder/` directory, registered with Nx via `project.json`, wired into the monorepo via npm workspaces and `tsconfig.base.json`. The 15 builder route files, CSS, `registry.ts`, and `version.ts` move wholesale from `apps/web`; only `@web/types` path alias imports are repointed to `@builder/types`. A minimal `forms.ts` is written from scratch (the builder only uses `FormFetchError` + `fetchFormDefinitions` from web's much larger `forms.ts`).

**Tech Stack:** React 19, Vite 8, TanStack Router v1 (file-based, auto code-splitting), `@govtech-bb/form-builder`, `@govtech-bb/form-types`, TypeScript 5.7, Nx 22

---

## File Map

### New files created in `apps/form_builder/`

| File | Purpose |
|---|---|
| `index.html` | Vite entry HTML |
| `.env.example` | Documents `VITE_API_URL` |
| `package.json` | Workspace package, lean deps |
| `project.json` | Nx build/dev/lint targets |
| `tsconfig.json` | Extends base, references form-types + form-builder packages |
| `vite.config.ts` | TanStack Router plugin, port 3002 |
| `eslint.config.ts` | ESLint config mirroring web |
| `src/main.tsx` | App entry point |
| `src/routes/__root.tsx` | Root layout with devtools |
| `src/routes/index.tsx` | Redirects `/` → `/builder` |
| `src/types/index.ts` | `ApiResponse`, `FormDefinitionSummary` |
| `src/lib/api/forms.ts` | Minimal: `FormFetchError` + `fetchFormDefinitions` |

### Files moved from `apps/web/src/` to `apps/form_builder/src/`

| Source | Destination | Import changes |
|---|---|---|
| `lib/api/registry.ts` | `lib/api/registry.ts` | `@web/types` → `@builder/types` |
| `lib/version.ts` | `lib/version.ts` | none |
| `styles/builder.module.css` | `styles/builder.module.css` | none (file has no imports) |
| `routes/builder/index.tsx` | `routes/builder/index.tsx` | `@web/types` → `@builder/types` |
| `routes/builder/-toolbar.tsx` | `routes/builder/-toolbar.tsx` | `@web/types` → `@builder/types` |
| `routes/builder/-form-picker.tsx` | `routes/builder/-form-picker.tsx` | `@web/types` → `@builder/types` |
| `routes/builder/-behaviours-editor.tsx` | `routes/builder/-behaviours-editor.tsx` | none |
| `routes/builder/-field-edit-panel.tsx` | `routes/builder/-field-edit-panel.tsx` | none |
| `routes/builder/-field-picker.tsx` | `routes/builder/-field-picker.tsx` | none |
| `routes/builder/-field-ref-picker.tsx` | `routes/builder/-field-ref-picker.tsx` | none |
| `routes/builder/-preview-modal.tsx` | `routes/builder/-preview-modal.tsx` | none |
| `routes/builder/-recipe-reducer.ts` | `routes/builder/-recipe-reducer.ts` | none |
| `routes/builder/-recipe-refs.ts` | `routes/builder/-recipe-refs.ts` | none |
| `routes/builder/-step-editor.tsx` | `routes/builder/-step-editor.tsx` | none |
| `routes/builder/-step-list.tsx` | `routes/builder/-step-list.tsx` | none |
| `routes/builder/-submit-modal.tsx` | `routes/builder/-submit-modal.tsx` | none |
| `routes/builder/-validation-panel.tsx` | `routes/builder/-validation-panel.tsx` | none |
| `routes/builder/-validation-rules-editor.tsx` | `routes/builder/-validation-rules-editor.tsx` | none |

### Files deleted from `apps/web/src/`

- `routes/builder/` (entire directory — 15 files)
- `lib/api/registry.ts`
- `lib/version.ts`
- `styles/builder.module.css`

### Root-level files modified

| File | Change |
|---|---|
| `tsconfig.base.json` | Add `@builder/types` path alias |
| `package.json` | Add `dev:builder` script |
| `apps/web/package.json` | Remove `@govtech-bb/form-builder` dependency |
| `apps/web/tsconfig.json` | Remove `packages/form-builder` project reference |

---

## Task 1: Scaffold config files

**Files:**
- Create: `apps/form_builder/index.html`
- Create: `apps/form_builder/.env.example`
- Create: `apps/form_builder/package.json`
- Create: `apps/form_builder/project.json`
- Create: `apps/form_builder/tsconfig.json`
- Create: `apps/form_builder/vite.config.ts`
- Create: `apps/form_builder/eslint.config.ts`

- [ ] **Step 1: Create `apps/form_builder/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Form Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `apps/form_builder/.env.example`**

```
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 3: Create `apps/form_builder/package.json`**

```json
{
  "name": "@govtech-bb/form-builder-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@govtech-bb/form-builder": "*",
    "@govtech-bb/form-types": "*",
    "@tanstack/react-router": "^1.168.22",
    "@tanstack/react-router-devtools": "^1.166.13",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "react": "^19.2.5",
    "react-dom": "^19.2.5"
  },
  "scripts": {
    "dev": "vite dev --port 3002",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@tanstack/router-plugin": "^1.167.22",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react": "^7.37.5",
    "globals": "^17.5.0",
    "jiti": "^2.6.1",
    "prettier": "^3.0.0",
    "typescript-eslint": "^8.58.2",
    "vite": "^8.0.0"
  }
}
```

- [ ] **Step 4: Create `apps/form_builder/project.json`**

```json
{
  "name": "form-builder",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/form_builder/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "command": "npm run build",
        "cwd": "apps/form_builder"
      },
      "dependsOn": ["^build"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm run dev",
        "cwd": "apps/form_builder"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["apps/form_builder/**/*.{ts,tsx}"]
      }
    }
  },
  "tags": []
}
```

- [ ] **Step 5: Create `apps/form_builder/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "types": ["react", "react-dom", "node", "vite/client"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "references": [
    { "path": "../../packages/form-types" },
    { "path": "../../packages/form-builder" }
  ],
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 6: Create `apps/form_builder/vite.config.ts`**

```ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return defineConfig({
    define: {
      "process.env": {
        VITE_API_URL: env["VITE_API_URL"],
      },
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
    ],
  });
};
```

- [ ] **Step 7: Create `apps/form_builder/eslint.config.ts`**

```ts
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,mts,cts,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  },
  pluginReact.configs.flat.recommended,
]);
```

- [ ] **Step 8: Commit**

```bash
git add apps/form_builder/
git commit -m "feat(form-builder-app): scaffold config files"
```

---

## Task 2: Scaffold app entry point

**Files:**
- Create: `apps/form_builder/src/main.tsx`
- Create: `apps/form_builder/src/routes/__root.tsx`
- Create: `apps/form_builder/src/routes/index.tsx`

- [ ] **Step 1: Create `apps/form_builder/src/main.tsx`**

```tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
```

- [ ] **Step 2: Create `apps/form_builder/src/routes/__root.tsx`**

```tsx
import React from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <>
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({
  component: RootLayout,
});
```

- [ ] **Step 3: Create `apps/form_builder/src/routes/index.tsx`**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/builder" });
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/form_builder/src/
git commit -m "feat(form-builder-app): scaffold app entry point and root route"
```

---

## Task 3: Create types

**Files:**
- Create: `apps/form_builder/src/types/index.ts`

- [ ] **Step 1: Create `apps/form_builder/src/types/index.ts`**

These two types are the only ones the builder uses from `@web/types`. They are duplicated here rather than shared because the web app's `ApiResponse` carries renderer-specific submission statuses that the builder doesn't need.

```ts
export interface ApiResponse {
  status: "success" | "failed" | string;
  message: string;
  data: unknown;
  statusCode?: number;
}

export interface FormDefinitionSummary {
  formId: string;
  title: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/form_builder/src/types/
git commit -m "feat(form-builder-app): add builder types (ApiResponse, FormDefinitionSummary)"
```

---

## Task 4: Create minimal forms API lib

**Files:**
- Create: `apps/form_builder/src/lib/api/forms.ts`

The builder only needs `FormFetchError` (for error handling and re-export to `registry.ts`) and `fetchFormDefinitions` (to populate the open-existing-form picker). The full `apps/web/src/lib/api/forms.ts` has ~250 lines covering draft, submission, and renderer concerns — none of which belong here.

- [ ] **Step 1: Create `apps/form_builder/src/lib/api/forms.ts`**

```ts
import type { ApiResponse, FormDefinitionSummary } from "@builder/types";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3001";

export class FormFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FormFetchError";
  }
}

interface FormDefinitionsListResponse extends ApiResponse {
  data: FormDefinitionSummary[];
}

const makeFetch = async <T extends ApiResponse>(
  endpoint: string,
  errorMessages: { not_found?: string } = {},
  init: RequestInit = { method: "GET" },
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, init);
  } catch {
    throw new FormFetchError(
      "Unable to reach the server. Please check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? (errorMessages.not_found ?? "Requested resource was not found.")
        : `Request failed (HTTP ${response.status}).`;
    throw new FormFetchError(message, response.status);
  }

  const body = (await response.json()) as T;
  if (body.status && body.status !== "success") {
    throw new FormFetchError(
      body.message ?? "The server returned an unexpected response.",
      500,
    );
  }

  return body;
};

export const fetchFormDefinitions = async (): Promise<
  FormDefinitionSummary[]
> => {
  const body = await makeFetch<FormDefinitionsListResponse>(
    "/form-definitions",
    { not_found: "Form definitions could not be found." },
  );
  return body.data;
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/form_builder/src/lib/
git commit -m "feat(form-builder-app): add minimal forms API lib"
```

---

## Task 5: Move registry.ts

**Files:**
- Create: `apps/form_builder/src/lib/api/registry.ts`

Copy `apps/web/src/lib/api/registry.ts` verbatim, then change the single `@web/types` import to `@builder/types`. All other imports (`@govtech-bb/form-types`, `@govtech-bb/form-builder`, `./forms`) are unchanged.

- [ ] **Step 1: Copy the file**

```bash
cp apps/web/src/lib/api/registry.ts apps/form_builder/src/lib/api/registry.ts
```

- [ ] **Step 2: Update the `@web/types` import in `apps/form_builder/src/lib/api/registry.ts`**

Find:
```ts
import type { ApiResponse } from "@web/types";
```

Replace with:
```ts
import type { ApiResponse } from "@builder/types";
```

- [ ] **Step 3: Commit**

```bash
git add apps/form_builder/src/lib/api/registry.ts
git commit -m "feat(form-builder-app): move registry API lib from apps/web"
```

---

## Task 6: Move version.ts

**Files:**
- Create: `apps/form_builder/src/lib/version.ts`

`version.ts` has no imports — it's pure utility functions. Copy it as-is.

- [ ] **Step 1: Copy the file**

```bash
cp apps/web/src/lib/version.ts apps/form_builder/src/lib/version.ts
```

- [ ] **Step 2: Commit**

```bash
git add apps/form_builder/src/lib/version.ts
git commit -m "feat(form-builder-app): move version utility from apps/web"
```

---

## Task 7: Move builder CSS

**Files:**
- Create: `apps/form_builder/src/styles/builder.module.css`

The CSS module has no imports and is exclusively used by builder route files. The relative import path `../../styles/builder.module.css` is identical in both apps (same directory depth from `src/routes/builder/`), so no import changes are needed in the route files.

- [ ] **Step 1: Copy the file**

```bash
mkdir -p apps/form_builder/src/styles
cp apps/web/src/styles/builder.module.css apps/form_builder/src/styles/builder.module.css
```

- [ ] **Step 2: Commit**

```bash
git add apps/form_builder/src/styles/
git commit -m "feat(form-builder-app): move builder CSS module from apps/web"
```

---

## Task 8: Move builder route files

**Files:**
- Create: `apps/form_builder/src/routes/builder/` (15 files)

Copy all 15 files from `apps/web/src/routes/builder/`. Three files need `@web/types` → `@builder/types` import updates. All relative path imports (`../../lib/api/registry`, `../../lib/api/forms`, `../../lib/version`, `../../styles/builder.module.css`) are unchanged — the directory depth is identical in both apps.

- [ ] **Step 1: Copy all 15 files**

```bash
mkdir -p apps/form_builder/src/routes/builder
cp apps/web/src/routes/builder/* apps/form_builder/src/routes/builder/
```

- [ ] **Step 2: Update `@web/types` → `@builder/types` in `index.tsx`**

In `apps/form_builder/src/routes/builder/index.tsx`, find:
```ts
import type { FormDefinitionSummary } from "@web/types";
```

Replace with:
```ts
import type { FormDefinitionSummary } from "@builder/types";
```

- [ ] **Step 3: Update `@web/types` → `@builder/types` in `-toolbar.tsx`**

In `apps/form_builder/src/routes/builder/-toolbar.tsx`, find:
```ts
import type { FormDefinitionSummary } from "@web/types";
```

Replace with:
```ts
import type { FormDefinitionSummary } from "@builder/types";
```

- [ ] **Step 4: Update `@web/types` → `@builder/types` in `-form-picker.tsx`**

In `apps/form_builder/src/routes/builder/-form-picker.tsx`, find:
```ts
import type { FormDefinitionSummary } from "@web/types";
```

Replace with:
```ts
import type { FormDefinitionSummary } from "@builder/types";
```

- [ ] **Step 5: Commit**

```bash
git add apps/form_builder/src/routes/builder/
git commit -m "feat(form-builder-app): move builder route files from apps/web"
```

---

## Task 9: Root-level changes

**Files:**
- Modify: `tsconfig.base.json`
- Modify: `package.json` (root)

- [ ] **Step 1: Add `@builder/types` path alias to `tsconfig.base.json`**

In the `"paths"` object, add after the `@web/components` entry:

```json
"@builder/types": ["apps/form_builder/src/types/index.ts"]
```

The full `paths` block should look like:
```json
"paths": {
  "@govtech-bb/form-types": ["packages/form-types/src/index.ts"],
  "@govtech-bb/form-builder": ["packages/form-builder/src/index.ts"],
  "@govtech-bb/form-conditions": ["packages/form-conditions/src/index.ts"],
  "@govtech-bb/form-validation": ["packages/form-validation/src/index.ts"],
  "@web/types": ["apps/web/src/types/index.ts"],
  "@web/lib": ["apps/web/src/lib/form-builder/index.ts"],
  "@web/form-api": ["apps/web/src/lib/api/forms.ts"],
  "@web/components": ["apps/web/src/components"],
  "@builder/types": ["apps/form_builder/src/types/index.ts"]
}
```

- [ ] **Step 2: Add `dev:builder` script to root `package.json`**

In the `"scripts"` object, add after `dev:api`:

```json
"dev:builder": "nx dev form-builder"
```

- [ ] **Step 3: Commit**

```bash
git add tsconfig.base.json package.json
git commit -m "feat(form-builder-app): add @builder/types alias and dev:builder script"
```

---

## Task 10: Install dependencies and generate route tree

Running `npm install` at the repo root picks up the new `apps/form_builder` workspace package. The TanStack Router Vite plugin generates `src/routeTree.gen.ts` on first dev server start.

- [ ] **Step 1: Install from repo root**

```bash
npm install
```

Expected: no errors. The lockfile updates to include `@govtech-bb/form-builder-app`.

- [ ] **Step 2: Start the dev server to generate `routeTree.gen.ts`**

Run from repo root:
```bash
npm run dev:builder
```

Expected output includes:
```
♻️  Generating route tree...
✅ Processed X routes
  VITE vX.X ready in Xms
  ➜  Local:   http://localhost:3002/
```

Once the server is running, open `http://localhost:3002` in a browser — it should redirect to `http://localhost:3002/builder` and render the form builder UI.

- [ ] **Step 3: Stop the dev server (Ctrl+C)**

- [ ] **Step 4: Commit the generated route tree**

```bash
git add apps/form_builder/src/routeTree.gen.ts
git commit -m "feat(form-builder-app): add generated TanStack Router route tree"
```

---

## Task 11: Clean up `apps/web`

Remove the builder files from `apps/web` and trim its dependencies. Do this only after confirming the builder runs in `apps/form_builder` (Task 10).

**Files:**
- Delete: `apps/web/src/routes/builder/` (entire directory)
- Delete: `apps/web/src/lib/api/registry.ts`
- Delete: `apps/web/src/lib/version.ts`
- Delete: `apps/web/src/styles/builder.module.css`
- Modify: `apps/web/package.json` — remove `@govtech-bb/form-builder`
- Modify: `apps/web/tsconfig.json` — remove `packages/form-builder` project reference

- [ ] **Step 1: Delete builder route directory**

```bash
rm -rf apps/web/src/routes/builder
```

- [ ] **Step 2: Delete registry.ts and version.ts**

```bash
rm apps/web/src/lib/api/registry.ts
rm apps/web/src/lib/version.ts
```

- [ ] **Step 3: Delete builder CSS**

```bash
rm apps/web/src/styles/builder.module.css
```

- [ ] **Step 4: Remove `@govtech-bb/form-builder` from `apps/web/package.json`**

In `apps/web/package.json`, remove the entire line:
```json
"@govtech-bb/form-builder": "*",
```

- [ ] **Step 5: Remove `packages/form-builder` project reference from `apps/web/tsconfig.json`**

In `apps/web/tsconfig.json`, remove from the `"references"` array:
```json
{ "path": "../../packages/form-builder" }
```

The remaining references should be:
```json
"references": [
  { "path": "../../packages/form-types" },
  { "path": "../../packages/form-validation" },
  { "path": "../../packages/form-conditions" }
]
```

- [ ] **Step 6: Update lockfile**

```bash
npm install
```

Expected: no errors. The lockfile removes `@govtech-bb/form-builder` from web's dependency tree.

- [ ] **Step 7: Verify web app still starts**

```bash
npm run dev:web
```

Expected: Vite starts on port 3000 with no errors. Navigate to `http://localhost:3000` — the form listing page renders correctly. There should be no `/builder` route.

Stop the server (Ctrl+C).

- [ ] **Step 8: Commit**

```bash
git add apps/web/
git commit -m "feat(form-builder-app): remove builder from apps/web"
```

---

## Task 12: Final verification

Confirm both apps build cleanly and Nx sees the new project.

- [ ] **Step 1: Verify Nx discovers `form-builder`**

```bash
npx nx show projects
```

Expected output includes: `form-builder`, `web`, `api`

- [ ] **Step 2: Lint the new app**

```bash
npx nx lint form-builder
```

Expected: no errors.

- [ ] **Step 3: Lint web to confirm no lingering builder imports**

```bash
npx nx lint web
```

Expected: no errors.

- [ ] **Step 4: Commit if any lint fixes were needed, otherwise done**

If all steps pass with no errors, the extraction is complete.
