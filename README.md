# modular-forms-monorepo

Modular form component system for Barbados government services.

## Prerequisites

- Node.js >= 20
- npm >= 10

## Getting started

```bash
npm install
```

## Project structure

```
apps/
  web/          Next.js frontend (port 4200)
  api/          NestJS backend  (port 3001)

packages/
  form-types/       Shared TypeScript types
  form-conditions/  Condition evaluation logic
  form-registry/    Component registry
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev:web` | Start web app in dev mode |
| `npm run dev:api` | Start API in dev mode |
| `npm run start:web` | Start web app in production mode |
| `npm run start:api` | Start API in production mode |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Lint all apps and packages |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |

## Environment variables

Copy the example files and adjust as needed:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

| Variable | App | Default | Description |
|---|---|---|---|
| `PORT` | web | `4200` | Next.js server port |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:3001` | API base URL |
| `API_PORT` | api | `3001` | NestJS server port |
| `DB_HOST` | api | — | PostgreSQL host |
| `DB_PORT` | api | `5432` | PostgreSQL port |
| `DB_DATABASE` | api | — | Database name |
| `DB_USERNAME` | api | — | Database user |
| `DB_PASSWORD` | api | — | Database password |

## Deployment

### Web (AWS Amplify — WEB_COMPUTE)

The `amplify.yml` at the repo root configures the build. Amplify uses the `WEB_COMPUTE` platform to run Next.js as a server-side Node.js application.

The build process:
1. Installs dependencies from the monorepo root
2. Builds shared packages via Nx (`form-types`, `form-conditions`, `form-registry`)
3. Runs `next build` directly from `apps/web` — this is required to produce a standalone output bundle
4. Assembles the `.amplify-hosting/` directory in `postBuild` with the compute bundle and static assets

`apps/web/next.config.js` must have `output: "standalone"` set. This tells Next.js to bundle a self-contained Node.js server at `apps/web/.next/standalone`, which Amplify uses as the compute entrypoint.

Set `NEXT_PUBLIC_API_URL` in the Amplify console under the branch environment variables.

### API (AWS Fargate)

A Dockerfile is provided at `apps/api/Dockerfile`. Build and push to ECR:

```bash
docker build -f apps/api/Dockerfile -t govtech-api .
```

DB connection environment variables (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) should be injected into the ECS task definition, ideally sourced from AWS Secrets Manager.

## Path aliases

Shared packages are available via these TypeScript path aliases (configured in `tsconfig.base.json`):

- `@govtech-bb/form-types`
- `@govtech-bb/form-conditions`
- `@govtech-bb/form-registry`

## Nx

```bash
npx nx graph          # Visualize the dependency graph
npx nx show projects  # List all projects
npx nx build web      # Build a single project (local dev only — see Deployment note above)
```
