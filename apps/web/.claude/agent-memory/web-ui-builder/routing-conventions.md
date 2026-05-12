---
name: routing-conventions
description: TanStack Router file-based routing conventions and non-route file naming used in this project
metadata:
  type: project
---

TanStack Router is configured via the Vite plugin (`@tanstack/router-plugin/vite`).

- Route files live under `apps/web/src/routes/`
- `routeTree.gen.ts` is auto-generated — NEVER edit it manually
- Files prefixed with `-` (e.g. `-recipe-reducer.ts`) are NOT treated as route segments — use this for co-located helpers, reducers, sub-components inside a route directory
- New routes only appear in the type system after `vite dev` regenerates `routeTree.gen.ts`; TypeScript errors about unrecognised path strings are expected until that happens
- Route loaders are defined on `createFileRoute(path)({ loader: async () => ... })` — data fetching ONLY in loaders, not in component mount effects

**Why:** The TanStack Router plugin scans the filesystem to build the route tree at dev/build time. Until it runs, new paths are unknown to the type registry.

**How to apply:** When a TypeScript check shows "not assignable to keyof FileRoutesByPath", this is expected for freshly-created route files. Run `npm run dev:web` to regenerate.
