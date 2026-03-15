---
name: scaffold-package
description: Scaffold a new monorepo workspace package with project conventions (tsconfig, eslint, package.json, exports). Use when creating apps/web, packages/db, packages/api, or any new workspace.
---

# Scaffold Package

Create a new workspace package in the Eat Out Adviser monorepo following all project conventions.

## Arguments

- `name` (required): Package name (e.g., `web`, `db`, `api`, `ai`, `scoring`, `shared`)
- `type` (required): `app` or `package`
- `description` (optional): One-line description

## Conventions to Follow

- **Package name**: `@eat-out-adviser/{name}` in package.json
- **Location**: `apps/{name}/` for apps, `packages/{name}/` for packages
- **TypeScript**: Extend `../../tsconfig.base.json` with strict mode
- **Files**: kebab-case filenames, PascalCase exports
- **Node engine**: `>=22.0.0`
- **Package manager**: `pnpm@10.6.0`

## Steps

1. Create the directory structure:

   ```text
   {type}s/{name}/
   ├── package.json
   ├── tsconfig.json
   ├── src/
   │   └── index.ts
   └── README.md (only if app)
   ```

2. Generate `package.json`:

   ```json
   {
     "name": "@eat-out-adviser/{name}",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "exports": {
       ".": "./src/index.ts"
     },
     "scripts": {
       "build": "tsc",
       "type-check": "tsc --noEmit",
       "lint": "eslint .",
       "lint:fix": "eslint . --fix",
       "test": "vitest run",
       "test:watch": "vitest"
     },
     "devDependencies": {
       "typescript": "^5.7.0"
     }
   }
   ```

3. Generate `tsconfig.json`:

   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "include": ["src/**/*"]
   }
   ```

4. For `apps/web` specifically, scaffold Next.js 16 with App Router:
   - Add `next`, `react`, `react-dom` dependencies
   - Create `app/` directory with layout.tsx and page.tsx
   - Add `next.config.ts` with Turbopack enabled
   - Include jsx-a11y strict mode in ESLint config

5. For `packages/db` specifically:
   - Add `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless` or `pg`
   - Create `src/schema/` directory
   - Create `drizzle.config.ts`

6. For `packages/api` specifically:
   - Add `@trpc/server`, `@trpc/client`, `zod`
   - Create `src/routers/` directory
   - Create `src/trpc.ts` with base router setup

7. For `packages/ai` specifically:
   - Add `@google/genai` (NOT @anthropic-ai/sdk, NOT @google/generative-ai)
   - Create `src/gemini.ts` for client initialization

8. Run `pnpm install` to link the new workspace

9. Verify with `pnpm type-check` that the new package compiles

## Language

All comments and README content must be in Portuguese. Code identifiers in English.
