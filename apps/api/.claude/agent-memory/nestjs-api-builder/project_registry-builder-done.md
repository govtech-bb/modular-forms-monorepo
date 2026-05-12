---
name: registry-builder-api-done
description: Registry builder API implementation complete — RegistryBuilderModule wired into RegistryModule
metadata:
  type: project
---

RegistryBuilderController and RegistryBuilderService are registered as controller/provider directly inside `RegistryModule` (not as a separate imported sub-module) to avoid circular dependencies and share the same TypeORM CustomComponent repository registration.

**Why:** `RegistryBuilderService` injects both `RegistryService` and `Repository<CustomComponent>`. Both are already provided by `RegistryModule` — wiring the builder into the same module avoids forwardRef or duplicate TypeORM feature registrations.

**How to apply:** When adding new services to the registry domain that depend on `RegistryService`, add them as providers in `RegistryModule` rather than creating a new importing module.

The `packages/form-builder` reference was added to `apps/api/tsconfig.json` references to enable the `@govtech-bb/form-builder` path alias. Without this, TS6307 fires even though the path alias exists in `tsconfig.base.json`.
