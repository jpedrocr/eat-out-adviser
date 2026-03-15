# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eat Out Adviser is a Portuguese-language accessibility-first restaurant recommendation platform. It's a pnpm monorepo
(Turborepo) with planned workspaces: `apps/*` (Next.js 16 web app), `packages/*` (db, api, ai, scoring, shared), and
`mcp` (Model Context Protocol server). The project is currently in the initialization phase — configuration and
documentation are in place, application code is not yet scaffolded.

## Commands

```bash
# Development
pnpm dev                    # Start all workspaces in dev mode (turbo)
pnpm build                  # Build all workspaces
pnpm type-check             # TypeScript type checking across all packages

# Linting & Formatting
pnpm lint                   # ESLint across all workspaces (via turbo)
pnpm lint:fix               # ESLint with auto-fix
pnpm lint:md                # Markdown linting (markdownlint-cli2)
pnpm format                 # Prettier write
pnpm format:check           # Prettier check

# Testing
pnpm test                   # Unit tests (Vitest, via turbo)
pnpm test:e2e               # E2E tests (Playwright)
pnpm test:a11y              # Accessibility tests (axe-core + Playwright)
pnpm test:coverage          # Unit tests with coverage

# Database (Drizzle ORM)
pnpm db:generate            # Generate migration files from schema
pnpm db:migrate             # Run migrations
pnpm db:push                # Push schema directly to database
pnpm db:seed                # Seed database with initial data

# Docker
pnpm docker:up:dev          # Start dev containers (postgres, ollama)
pnpm docker:up              # Start production containers
pnpm docker:down            # Stop containers
```

## Architecture

**Monorepo layout** (pnpm workspaces + Turborepo):

- `apps/web/` — Next.js 16 app (App Router, Turbopack, Server Components)
- `packages/db/` — Drizzle ORM schemas, migrations, seeds (PostgreSQL 17 + pgvector)
- `packages/api/` — tRPC routers (type-safe API layer)
- `packages/ai/` — Gemini integration (LLM, vision, embeddings, RAG)
- `packages/scoring/` — Accessibility scoring algorithm (0-100, personalized per user profile)
- `packages/shared/` — Shared TypeScript types, Zod validators, constants
- `mcp/` — Custom MCP server exposing app features to AI agents

**Key technology decisions:**

- **AI API: Google Gemini** — use `@google/genai` SDK (NOT `@anthropic-ai/sdk`, NOT the deprecated
  `@google/generative-ai`). Models: Gemini 2.5 Pro/Flash (stable), Gemini 3.1 Pro Preview (frontier).
- **Embeddings:** Gemini Embedding 2 (API) or Ollama + nomic-embed-text-v2 (local self-hosting)
- **Database:** PostgreSQL 17 with pgvector extension for vector search + full-text search hybrid RAG
- **Auth:** Better Auth (TypeScript-first, supports OAuth, 2FA, passkeys, RBAC)
- **Real-time:** Server-Sent Events (SSE) via Next.js Route Handlers

## Code Conventions

**Commit messages:** Conventional Commits enforced via commitlint. Types: `feat`, `fix`, `docs`, `style`, `refactor`,
`perf`, `test`, `build`, `ci`, `chore`, `revert`, `a11y`. Scopes: `web`, `db`, `api`, `ai`, `scoring`, `shared`, `mcp`,
`docker`, `ci`, `deps`. Subject max 72 chars.

**TypeScript:** Strict mode with `noUncheckedIndexedAccess`. Base config in `tsconfig.base.json`, packages extend it.

**ESLint:** Flat config (v9) with type-aware linting, jsx-a11y in **strict** mode, React Hooks, Next.js core-web-vitals.

**Prettier:** Double quotes, semicolons, trailing commas, 100 char width (120 for Markdown), Tailwind CSS class sorting.

**Naming:** Files in `kebab-case.tsx`, exports in `PascalCase`. Database tables in `snake_case` (plural), UUIDs v7 as
primary keys.

**Language:** All documentation, comments, and UI text in Portuguese. Code identifiers in English.

## Critical Constraint: Accessibility First

This project's core mission is physical accessibility for wheelchair users. Every UI component, test, and feature must
prioritize accessibility:

- jsx-a11y ESLint plugin runs in **strict** mode (not recommended)
- E2E tests use Playwright accessibility selectors (`getByRole`, `getByLabel`)
- axe-core integration for automated WCAG 2.1 AA/AAA validation
- Touch targets minimum 44x44px (WCAG 2.5.5)
- The `a11y` commit type exists specifically for accessibility improvements

## Documentation

All specifications are in the repository root — see [INDEX.md](INDEX.md) for a complete guide. Key docs: SPEC.md
(requirements), TECH_STACK.md (technology choices), PROJECT_STRUCTURE.md (directory layout), DATA_MODEL.md (database
schema), API_SPEC.md (tRPC endpoints), AI_FEATURES.md (Gemini integration), ACCESSIBILITY_RATING.md (scoring algorithm).
