# Eat Out Adviser - Estrutura do Projecto e Arquitectura

**Data:** Marco de 2026
**Projecto:** Eat Out Adviser - Plataforma de acessibilidade para restaurantes
**Stack:** Next.js 16, tRPC, PostgreSQL 17 + pgvector, Drizzle ORM, Better Auth, Claude API, Docker multi-arch, Coolify
**Ambientes:** MacBook Air M1 16GB (desenvolvimento) | Proxmox Intel N5105 16GB (producao)

---

## Indice

1. [Estrutura Completa de Directorios](#1-estrutura-completa-de-directorios)
2. [Descricao Detalhada de Cada Directorio](#2-descricao-detalhada-de-cada-directorio)
3. [Conteudo dos Ficheiros de Configuracao](#3-conteudo-dos-ficheiros-de-configuracao)
4. [Diagramas de Arquitectura](#4-diagramas-de-arquitectura)
5. [Convencoes de Nomenclatura](#5-convencoes-de-nomenclatura)
6. [Workflow de Desenvolvimento](#6-workflow-de-desenvolvimento)

---

## 1. Estrutura Completa de Directorios

```
eat-out-adviser/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Pipeline CI: lint, testes, build
│   │   ├── deploy.yml                # Deploy automatico via Coolify webhook
│   │   └── codeql.yml                # Analise de seguranca CodeQL
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   └── accessibility_report.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── .husky/
│   ├── pre-commit                    # lint-staged antes de cada commit
│   └── commit-msg                    # commitlint valida mensagem
├── apps/
│   └── web/                          # Aplicacao principal Next.js 16
│       ├── src/
│       │   ├── app/                  # App Router (Next.js)
│       │   │   ├── [locale]/         # Routing i18n (pt, en)
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx
│       │   │   │   ├── (auth)/       # Grupo de autenticacao
│       │   │   │   │   ├── login/
│       │   │   │   │   ├── register/
│       │   │   │   │   └── forgot-password/
│       │   │   │   ├── (app)/        # Grupo principal da aplicacao
│       │   │   │   │   ├── dashboard/
│       │   │   │   │   ├── search/
│       │   │   │   │   ├── restaurants/
│       │   │   │   │   │   ├── [slug]/
│       │   │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   │   ├── reviews/
│       │   │   │   │   │   │   ├── menu/
│       │   │   │   │   │   │   ├── accessibility/
│       │   │   │   │   │   │   └── reserve/
│       │   │   │   │   ├── map/
│       │   │   │   │   ├── profile/
│       │   │   │   │   │   ├── accessibility/
│       │   │   │   │   │   └── settings/
│       │   │   │   │   ├── reviews/
│       │   │   │   │   ├── reservations/
│       │   │   │   │   └── ai-assistant/
│       │   │   │   └── (admin)/      # Area de administracao
│       │   │   │       ├── dashboard/
│       │   │   │       ├── restaurants/
│       │   │   │       ├── users/
│       │   │   │       ├── reviews/
│       │   │   │       └── verifications/
│       │   │   ├── api/
│       │   │   │   └── trpc/[trpc]/route.ts
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── ui/               # Componentes shadcn/ui
│       │   │   ├── layout/           # Header, Footer, Nav, Sidebar
│       │   │   ├── restaurant/       # Componentes de restaurante
│       │   │   ├── accessibility/    # Componentes de acessibilidade
│       │   │   ├── review/           # Componentes de avaliacao
│       │   │   ├── map/              # Componentes de mapa
│       │   │   ├── ai/               # Componentes do assistente IA
│       │   │   └── forms/            # Componentes de formulario
│       │   ├── lib/
│       │   │   ├── trpc/             # Configuracao do cliente tRPC
│       │   │   ├── auth/             # Cliente Better Auth
│       │   │   ├── i18n/             # Internacionalizacao
│       │   │   ├── utils/            # Funcoes utilitarias
│       │   │   └── hooks/            # Custom React hooks
│       │   ├── styles/
│       │   └── types/
│       ├── public/
│       │   ├── locales/
│       │   │   ├── pt/               # Traducoes portugues
│       │   │   └── en/               # Traducoes ingles
│       │   ├── icons/
│       │   └── images/
│       ├── tests/
│       │   ├── unit/                 # Testes unitarios (Vitest)
│       │   ├── integration/          # Testes de integracao (Vitest)
│       │   └── e2e/                  # Testes end-to-end (Playwright)
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── vitest.config.ts
├── packages/
│   ├── db/                           # Pacote de base de dados
│   │   ├── src/
│   │   │   ├── schema/              # Esquemas Drizzle ORM
│   │   │   │   ├── user.ts
│   │   │   │   ├── restaurant.ts
│   │   │   │   ├── accessibility.ts
│   │   │   │   ├── review.ts
│   │   │   │   ├── menu.ts
│   │   │   │   ├── reservation.ts
│   │   │   │   ├── verification.ts
│   │   │   │   ├── photo.ts
│   │   │   │   ├── translation.ts
│   │   │   │   ├── audit.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/          # Migracoes SQL geradas
│   │   │   ├── seed/                # Dados iniciais
│   │   │   │   ├── restaurants.ts
│   │   │   │   ├── accessibility.ts
│   │   │   │   └── index.ts
│   │   │   └── client.ts            # Instancia do cliente Drizzle
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   ├── api/                          # Pacote de routers tRPC
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── restaurant.ts
│   │   │   │   ├── review.ts
│   │   │   │   ├── menu.ts
│   │   │   │   ├── reservation.ts
│   │   │   │   ├── ai.ts
│   │   │   │   ├── verification.ts
│   │   │   │   ├── admin.ts
│   │   │   │   └── index.ts         # appRouter combinado
│   │   │   ├── middleware/           # Middleware tRPC (auth, rate-limit)
│   │   │   ├── context.ts           # Contexto tRPC (sessao, db)
│   │   │   └── trpc.ts              # Inicializacao tRPC
│   │   └── package.json
│   ├── ai/                           # Pacote de integracao IA
│   │   ├── src/
│   │   │   ├── claude/
│   │   │   │   ├── client.ts        # Cliente Anthropic SDK
│   │   │   │   ├── prompts/
│   │   │   │   │   ├── search.ts    # System prompt de pesquisa
│   │   │   │   │   ├── vision.ts    # Prompt de analise de fotos
│   │   │   │   │   ├── assistant.ts # Prompt do assistente
│   │   │   │   │   ├── summary.ts   # Prompt de sumarizacao
│   │   │   │   │   └── translation.ts
│   │   │   │   └── tools/           # Tool definitions para Claude
│   │   │   ├── embeddings/
│   │   │   │   ├── client.ts        # Cliente Ollama/API
│   │   │   │   └── pipeline.ts      # Pipeline de geracao
│   │   │   ├── matching/
│   │   │   │   ├── scorer.ts        # Motor de scoring
│   │   │   │   └── weights.ts       # Pesos do matching
│   │   │   └── rag/
│   │   │       ├── search.ts        # Busca hibrida vectorial+lexica
│   │   │       └── context.ts       # Construcao de contexto RAG
│   │   └── package.json
│   ├── scoring/                      # Pacote de pontuacao de acessibilidade
│   │   ├── src/
│   │   │   ├── calculator.ts        # Motor de calculo
│   │   │   ├── weights.ts           # Pesos por categoria
│   │   │   ├── thresholds.ts        # Limiares de classificacao
│   │   │   └── index.ts
│   │   └── package.json
│   └── shared/                       # Tipos, constantes e utilitarios
│       ├── src/
│       │   ├── types/               # Interfaces TypeScript partilhadas
│       │   ├── constants/           # Constantes globais
│       │   ├── validators/          # Esquemas Zod
│       │   └── utils/               # Funcoes utilitarias puras
│       └── package.json
├── docker/
│   ├── Dockerfile.app                # Multi-stage, multi-arch (Next.js)
│   ├── Dockerfile.ollama             # Ollama para embeddings locais
│   ├── docker-compose.yml            # Orquestracao de producao
│   ├── docker-compose.dev.yml        # Override para desenvolvimento
│   └── .env.example                  # Template de variaveis de ambiente
├── scripts/
│   ├── setup.sh                      # Configuracao inicial do projecto
│   ├── seed-db.ts                    # Povoamento da base de dados
│   ├── generate-embeddings.ts        # Geracao de embeddings vectoriais
│   ├── import-osm.ts                # Importacao de dados OpenStreetMap
│   ├── import-wheelmap.ts           # Importacao de dados Wheelmap
│   └── health-check.ts              # Verificacao de saude do sistema
├── mcp/                              # Servidor MCP personalizado
│   ├── src/
│   │   ├── server.ts                # Ponto de entrada do servidor
│   │   ├── tools/                   # Ferramentas MCP (busca, scoring)
│   │   └── resources/               # Recursos MCP expostos
│   └── package.json
├── docs/                             # Documentacao do projecto
├── .claude/                          # Configuracao Claude Code
│   └── settings.json
├── eslint.config.js                  # ESLint 9 flat config
├── .prettierrc                       # Configuracao Prettier
├── .markdownlint.json                # Regras markdownlint
├── commitlint.config.js              # Conventional Commits
├── turbo.json                        # Configuracao Turborepo
├── pnpm-workspace.yaml               # Definicao de workspaces pnpm
├── package.json                      # Raiz do monorepo
├── tsconfig.base.json                # TypeScript base partilhado
├── LICENSE                           # AGPL-3.0
└── README.md
```

---

## 2. Descricao Detalhada de Cada Directorio

### 2.1 `.github/` - Configuracao GitHub

**Proposito:** Automatizacao de CI/CD, templates de issues/PRs e gestao de dependencias.

| Ficheiro | Funcao | Ligacao |
|---|---|---|
| `workflows/ci.yml` | Pipeline principal: lint, type-check, testes unitarios, E2E, build | Executa em cada push e PR |
| `workflows/deploy.yml` | Deploy automatico via webhook Coolify quando merge em `main` | Depende de `ci.yml` passar |
| `workflows/codeql.yml` | Analise estatica de seguranca (JavaScript/TypeScript) | Executa semanalmente e em PRs |
| `ISSUE_TEMPLATE/` | Templates YAML para bugs, features e relatorios de acessibilidade | Padroniza contribuicoes |
| `PULL_REQUEST_TEMPLATE.md` | Checklist para revisao de PRs incluindo verificacao de acessibilidade | Obrigatorio para todas as PRs |
| `dependabot.yml` | Actualizacao automatica de dependencias npm e GitHub Actions | Verifica semanalmente |

### 2.2 `.husky/` - Git Hooks

**Proposito:** Execucao automatica de verificacoes antes de commits e pushes.

- `pre-commit` -- Executa `lint-staged` que corre ESLint e Prettier apenas nos ficheiros alterados.
- `commit-msg` -- Valida que a mensagem de commit segue o formato Conventional Commits via `commitlint`.

**Dependencias:** `husky`, `lint-staged`, `commitlint`.

### 2.3 `apps/web/` - Aplicacao Next.js 16

**Proposito:** Aplicacao principal do Eat Out Adviser. Contem toda a interface de utilizador, routing e ponto de entrada da API tRPC.

#### `src/app/` - App Router

Utiliza o App Router do Next.js 16 com grupos de rotas e routing internacionalizado.

| Directorio | Proposito | Notas |
|---|---|---|
| `[locale]/` | Segmento dinamico para idioma (`pt`, `en`) | Middleware redireciona com base no Accept-Language |
| `(auth)/` | Paginas de autenticacao (login, registo, recuperacao) | Layout proprio sem sidebar/nav principal |
| `(app)/` | Area principal da aplicacao autenticada | Layout com header, sidebar, nav |
| `(app)/dashboard/` | Painel principal com resumo personalizado | Mostra restaurantes recomendados e avaliacoes recentes |
| `(app)/search/` | Pesquisa em linguagem natural com IA | Integra com router `ai` do tRPC |
| `(app)/restaurants/[slug]/` | Pagina detalhada de restaurante | Sub-rotas para avaliacoes, ementa, acessibilidade, reserva |
| `(app)/map/` | Mapa interactivo com filtros de acessibilidade | Utiliza componentes do directorio `components/map/` |
| `(app)/profile/` | Perfil do utilizador com configuracao de acessibilidade | Sub-rotas para perfil de acessibilidade e definicoes |
| `(app)/ai-assistant/` | Assistente conversacional de IA | Streaming via SSE |
| `(admin)/` | Area de administracao com RBAC | Gestao de restaurantes, utilizadores, avaliacoes, verificacoes |
| `api/trpc/[trpc]/route.ts` | Handler HTTP para o endpoint tRPC | Liga o Next.js ao pacote `packages/api` |

#### `src/components/` - Componentes React

Organizados por dominio funcional. Convencoes:

- Ficheiros em `kebab-case.tsx` (ex.: `restaurant-card.tsx`)
- Exports com `PascalCase` (ex.: `RestaurantCard`)
- Cada componente pode ter ficheiro de testes adjacente (`restaurant-card.test.tsx`)

| Directorio | Conteudo | Exemplos |
|---|---|---|
| `ui/` | Componentes shadcn/ui copiados para o projecto | `button.tsx`, `dialog.tsx`, `input.tsx` |
| `layout/` | Estrutura visual da aplicacao | `header.tsx`, `footer.tsx`, `sidebar.tsx`, `mobile-nav.tsx` |
| `restaurant/` | Componentes especificos de restaurantes | `restaurant-card.tsx`, `restaurant-gallery.tsx`, `restaurant-info.tsx` |
| `accessibility/` | Componentes de visualizacao de acessibilidade | `accessibility-badge.tsx`, `accessibility-score.tsx`, `accessibility-checklist.tsx` |
| `review/` | Componentes de avaliacoes | `review-form.tsx`, `review-list.tsx`, `review-summary.tsx` |
| `map/` | Componentes de mapa interactivo | `map-view.tsx`, `map-marker.tsx`, `map-filters.tsx` |
| `ai/` | Interface do assistente IA | `chat-panel.tsx`, `message-bubble.tsx`, `suggestion-chips.tsx` |
| `forms/` | Formularios reutilizaveis | `search-form.tsx`, `reservation-form.tsx`, `report-form.tsx` |

#### `src/lib/` - Bibliotecas e Utilitarios

| Directorio | Proposito |
|---|---|
| `trpc/` | Configuracao do cliente tRPC (React Query provider, links) |
| `auth/` | Instancia do cliente Better Auth para o browser |
| `i18n/` | Configuracao de internacionalizacao (middleware, dicionarios, helpers) |
| `utils/` | Funcoes utilitarias puras (formatacao de datas, URLs, strings) |
| `hooks/` | Custom hooks React (`useAccessibilityProfile`, `useDebounce`, `useMediaQuery`) |

### 2.4 `packages/db/` - Pacote de Base de Dados

**Proposito:** Centralizacao de toda a logica de base de dados -- esquemas Drizzle, migracoes, seeds e cliente.

**Dependencias principais:** `drizzle-orm`, `drizzle-kit`, `postgres` (driver), `@pgvector/drizzle`.

| Ficheiro/Directorio | Proposito |
|---|---|
| `schema/user.ts` | Tabelas `users`, `sessions`, `accounts` (Better Auth) e `user_accessibility_profiles` |
| `schema/restaurant.ts` | Tabela `restaurants` com campos de localizacao, tipo de cozinha, faixa de preco, embedding |
| `schema/accessibility.ts` | Tabela `accessibility_profiles` -- a mais detalhada do sistema (entrada, interior, WC, estacionamento) |
| `schema/review.ts` | Tabelas `reviews` e `review_accessibility_ratings` com embedding vectorial |
| `schema/menu.ts` | Tabelas `menus` e `dishes` com alergenos, restricoes alimentares, embedding |
| `schema/reservation.ts` | Tabela `reservations` com necessidades de acessibilidade especificas |
| `schema/verification.ts` | Tabela `verification_reports` para relatorios profissionais e comunitarios |
| `schema/photo.ts` | Tabela `photos` com metadados, analise IA e etiquetas de acessibilidade |
| `schema/translation.ts` | Tabela `translations` para conteudo multilingue gerado por IA |
| `schema/audit.ts` | Tabela `audit_logs` para rastreabilidade total de alteracoes em dados de acessibilidade |
| `migrations/` | Ficheiros SQL gerados por `drizzle-kit generate` -- nunca editados manualmente |
| `seed/` | Scripts de povoamento inicial com dados de restaurantes e acessibilidade |
| `client.ts` | Exporta a instancia configurada do Drizzle com connection pooling |

**Convencao de nomenclatura na base de dados:** `snake_case` para tabelas (plural) e colunas. UUIDs v7 como chaves primarias. Timestamps com timezone.

### 2.5 `packages/api/` - Routers tRPC

**Proposito:** Toda a logica de negocio do backend, organizada em routers tRPC tipados.

**Dependencias principais:** `@trpc/server`, `@trpc/client`, `zod`, `@eat-out-adviser/db`, `@eat-out-adviser/ai`.

| Ficheiro | Proposito | Procedimentos principais |
|---|---|---|
| `routers/auth.ts` | Autenticacao e gestao de sessoes | `login`, `register`, `logout`, `forgotPassword` |
| `routers/user.ts` | Gestao de perfil e preferencias | `getProfile`, `updateProfile`, `updateAccessibilityProfile` |
| `routers/restaurant.ts` | CRUD de restaurantes e pesquisa | `getBySlug`, `search`, `nearby`, `create`, `update` |
| `routers/review.ts` | Avaliacoes de restaurantes | `create`, `list`, `getByRestaurant`, `report` |
| `routers/menu.ts` | Ementas e pratos | `getByRestaurant`, `updateMenu`, `analyzeDish` |
| `routers/reservation.ts` | Sistema de reservas | `create`, `cancel`, `list`, `checkAvailability` |
| `routers/ai.ts` | Interaccao com IA | `search`, `analyzePhoto`, `chat`, `summarizeReviews` |
| `routers/verification.ts` | Verificacao de acessibilidade | `submit`, `approve`, `reject`, `getHistory` |
| `routers/admin.ts` | Operacoes administrativas | `listUsers`, `moderateReview`, `stats`, `bulkImport` |
| `middleware/` | Middleware de autorizacao, rate limiting, logging | Ligacao com Better Auth para verificacao de sessao |
| `context.ts` | Fabrica de contexto tRPC | Injeccao de `db`, `session`, `user` em cada procedimento |
| `trpc.ts` | Inicializacao do tRPC com middleware base | Define `publicProcedure`, `protectedProcedure`, `adminProcedure` |

### 2.6 `packages/ai/` - Integracao de IA

**Proposito:** Encapsulamento de toda a logica de IA -- chamadas ao Claude, geracao de embeddings, RAG e matching.

**Dependencias principais:** `@anthropic-ai/sdk`, `ollama`, `@eat-out-adviser/db`.

| Directorio | Funcao |
|---|---|
| `claude/client.ts` | Instancia configurada do SDK Anthropic com retry e rate limiting |
| `claude/prompts/` | System prompts versionados para cada funcionalidade de IA |
| `claude/tools/` | Definicoes de ferramentas (tool use) para o Claude invocar |
| `embeddings/client.ts` | Cliente que abstrai Ollama (local) e API (producao) para geracao de embeddings |
| `embeddings/pipeline.ts` | Pipeline batch para gerar embeddings de restaurantes, avaliacoes e pratos |
| `matching/scorer.ts` | Motor de scoring que combina similaridade vectorial com pesos de acessibilidade |
| `matching/weights.ts` | Configuracao de pesos por categoria (entrada, interior, WC, estacionamento) |
| `rag/search.ts` | Busca hibrida: similaridade coseno via pgvector + full-text search PostgreSQL |
| `rag/context.ts` | Construcao do contexto enriquecido para enviar ao Claude (dados estruturados + resultados vectoriais) |

### 2.7 `packages/scoring/` - Pontuacao de Acessibilidade

**Proposito:** Algoritmo isolado de calculo de pontuacao de acessibilidade, reutilizavel entre frontend e backend.

- `calculator.ts` -- Motor principal que calcula pontuacao global e por categoria (0-100).
- `weights.ts` -- Pesos configuraves por perfil de mobilidade (cadeira electrica vs manual vs andarilho).
- `thresholds.ts` -- Limiares para classificacao textual (Excelente/Bom/Razoavel/Limitado/Inacessivel).

### 2.8 `packages/shared/` - Tipos e Utilitarios Partilhados

**Proposito:** Codigo partilhado entre todos os pacotes sem dependencias externas pesadas.

| Directorio | Conteudo |
|---|---|
| `types/` | Interfaces TypeScript (`Restaurant`, `User`, `AccessibilityProfile`, etc.) |
| `constants/` | Enumeracoes, codigos de erro, configuracoes estaticas |
| `validators/` | Esquemas Zod para validacao em runtime (formularios, API inputs) |
| `utils/` | Funcoes puras (slug generation, formatacao, calculo de distancias) |

### 2.9 `docker/` - Configuracao de Containers

| Ficheiro | Proposito |
|---|---|
| `Dockerfile.app` | Build multi-stage do Next.js: deps -> build -> runner (node:22-alpine) |
| `Dockerfile.ollama` | Container Ollama com modelo nomic-embed-text-v2 pre-carregado |
| `docker-compose.yml` | Orquestracao de producao: app + postgres + ollama + traefik |
| `docker-compose.dev.yml` | Override para desenvolvimento: volumes montados, hot-reload, portas expostas |
| `.env.example` | Template de variaveis de ambiente com todos os valores necessarios documentados |

### 2.10 `scripts/` - Scripts de Automacao

Todos executados via `tsx` (TypeScript runner). Invocados como `pnpm run` scripts ou directamente.

| Script | Proposito |
|---|---|
| `setup.sh` | Configuracao inicial: instala dependencias, cria `.env`, configura base de dados, executa migracoes |
| `seed-db.ts` | Povoa a base de dados com dados iniciais de restaurantes e categorias de acessibilidade |
| `generate-embeddings.ts` | Gera embeddings vectoriais para todos os restaurantes, avaliacoes e pratos existentes |
| `import-osm.ts` | Importa dados de restaurantes do OpenStreetMap para a zona metropolitana do Porto |
| `import-wheelmap.ts` | Importa dados de acessibilidade do Wheelmap (formato A11yJSON) |
| `health-check.ts` | Verifica conectividade com PostgreSQL, Ollama e Claude API |

### 2.11 `mcp/` - Servidor MCP Personalizado

**Proposito:** Expoe funcionalidades do Eat Out Adviser como ferramentas MCP para o Claude Code e outros agentes IA.

- `server.ts` -- Ponto de entrada do servidor MCP (protocolo stdio ou SSE).
- `tools/` -- Ferramentas: busca de restaurantes, consulta de acessibilidade, calculo de scoring.
- `resources/` -- Recursos: esquema da base de dados, documentacao da API, dados de restaurantes.

---

## 3. Conteudo dos Ficheiros de Configuracao

### 3.1 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:fix": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "tests/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "test:a11y": {
      "dependsOn": ["build"],
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 3.2 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "mcp"
```

### 3.3 `package.json` (raiz do monorepo)

```json
{
  "name": "eat-out-adviser",
  "private": true,
  "packageManager": "pnpm@10.6.0",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "start": "turbo start",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "lint:md": "markdownlint-cli2 '**/*.md' '#node_modules'",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "test:a11y": "turbo test:a11y",
    "test:coverage": "turbo test -- --coverage",
    "db:generate": "turbo db:generate --filter=@eat-out-adviser/db",
    "db:migrate": "turbo db:migrate --filter=@eat-out-adviser/db",
    "db:push": "turbo db:push --filter=@eat-out-adviser/db",
    "db:studio": "pnpm --filter @eat-out-adviser/db drizzle-kit studio",
    "db:seed": "tsx scripts/seed-db.ts",
    "ai:embed": "tsx scripts/generate-embeddings.ts",
    "ai:health": "tsx scripts/health-check.ts",
    "import:osm": "tsx scripts/import-osm.ts",
    "import:wheelmap": "tsx scripts/import-wheelmap.ts",
    "docker:build": "docker buildx build --platform linux/amd64,linux/arm64 -f docker/Dockerfile.app .",
    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "docker:up:dev": "docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down",
    "clean": "turbo clean && rm -rf node_modules",
    "prepare": "husky"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "eslint": "^9.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "markdownlint-cli2": "^0.17.0",
    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "tsx": "^4.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.7.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,yaml,yml}": [
      "prettier --write"
    ],
    "*.md": [
      "markdownlint-cli2 --fix",
      "prettier --write"
    ],
    "*.css": [
      "prettier --write"
    ]
  }
}
```

### 3.4 `eslint.config.js` (ESLint 9 Flat Config)

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import next from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // Ficheiros ignorados
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
    ],
  },

  // Regras base JavaScript
  js.configs.recommended,

  // TypeScript com type-aware linting
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React
  {
    plugins: { react },
    rules: {
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // React Hooks
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Acessibilidade JSX (fundamental para este projecto)
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.configs.strict.rules,
    },
  },

  // Next.js
  {
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },

  // Desactivar regras que conflituam com Prettier
  prettier,
);
```

### 3.5 `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"],
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "printWidth": 120,
        "proseWrap": "always"
      }
    }
  ]
}
```

### 3.6 `.markdownlint.json`

```json
{
  "default": true,
  "MD013": {
    "line_length": 120,
    "tables": false,
    "code_blocks": false
  },
  "MD024": {
    "siblings_only": true
  },
  "MD033": {
    "allowed_elements": ["details", "summary", "br", "sup"]
  },
  "MD041": true,
  "MD046": {
    "style": "fenced"
  }
}
```

### 3.7 `commitlint.config.js`

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",     // Nova funcionalidade
        "fix",      // Correccao de erro
        "docs",     // Documentacao
        "style",    // Formatacao (sem alteracao de logica)
        "refactor", // Refactoring de codigo
        "perf",     // Melhoria de performance
        "test",     // Testes
        "build",    // Sistema de build ou dependencias
        "ci",       // Configuracao de CI/CD
        "chore",    // Tarefas diversas
        "revert",   // Reverter commit anterior
        "a11y",     // Melhorias de acessibilidade
      ],
    ],
    "scope-enum": [
      1,
      "always",
      [
        "web",          // App Next.js
        "db",           // Pacote de base de dados
        "api",          // Pacote tRPC
        "ai",           // Pacote de IA
        "scoring",      // Pacote de pontuacao
        "shared",       // Pacote partilhado
        "mcp",          // Servidor MCP
        "docker",       // Configuracao Docker
        "ci",           // GitHub Actions
        "deps",         // Dependencias
      ],
    ],
    "subject-max-length": [2, "always", 72],
    "body-max-line-length": [1, "always", 100],
  },
};
```

### 3.8 `.husky/pre-commit`

```sh
pnpm exec lint-staged
```

### 3.9 `.husky/commit-msg`

```sh
pnpm exec commitlint --edit $1
```

### 3.10 `docker/docker-compose.yml`

```yaml
name: eat-out-adviser

services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile.app
      platforms:
        - linux/amd64
        - linux/arm64
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OLLAMA_BASE_URL=http://ollama:11434
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
    depends_on:
      postgres:
        condition: service_healthy
      ollama:
        condition: service_started
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: pgvector/pgvector:pg17
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${DB_NAME:-eatoutadviser}
      - POSTGRES_USER=${DB_USER:-eatout}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "${DB_PORT:-5432}:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-eatout} -d ${DB_NAME:-eatoutadviser}"]
      interval: 10s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "${OLLAMA_PORT:-11434}:11434"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 4G

volumes:
  postgres_data:
  ollama_data:
```

### 3.11 `docker/docker-compose.dev.yml`

```yaml
name: eat-out-adviser

services:
  app:
    build:
      target: deps
    command: pnpm dev
    volumes:
      - ..:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development

  postgres:
    ports:
      - "5432:5432"

  ollama:
    ports:
      - "11434:11434"
```

### 3.12 `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "22"
  PNPM_VERSION: "10"

jobs:
  lint-and-typecheck:
    name: Lint e Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm format:check
      - run: pnpm lint:md

  test-unit:
    name: Testes Unitarios
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage

      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  test-e2e:
    name: Testes E2E e Acessibilidade
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    services:
      postgres:
        image: pgvector/pgvector:pg17
        env:
          POSTGRES_DB: eatoutadviser_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test -d eatoutadviser_test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium

      - run: pnpm build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/eatoutadviser_test

      - run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/eatoutadviser_test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report/

  build-docker:
    name: Build Docker Multi-Arch
    runs-on: ubuntu-latest
    needs: [test-unit, test-e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-qemu-action@v3

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: docker/Dockerfile.app
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 3.13 `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm:*)",
      "Bash(turbo:*)",
      "Bash(npm:*)",
      "Bash(node:*)",
      "Bash(tsx:*)",
      "Bash(git:*)",
      "Bash(docker:*)",
      "Bash(docker compose:*)",
      "Bash(drizzle-kit:*)",
      "Bash(eslint:*)",
      "Bash(prettier:*)",
      "Bash(playwright:*)",
      "Bash(vitest:*)",
      "Bash(markdownlint-cli2:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(mkdir:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(rm:*)",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "mcp__eat-out-adviser"
    ],
    "deny": [
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(sudo:*)"
    ]
  }
}
```

---

## 4. Diagramas de Arquitectura

### 4.1 Diagrama de Interaccao de Componentes

```
+----------------------------------------------------------------------+
|                          BROWSER / PWA                                |
|  +------------------+  +------------------+  +--------------------+  |
|  | React Components |  | shadcn/ui + Radix|  | Tailwind CSS v4    |  |
|  | (Server + Client)|  | (Acessibilidade) |  | (Estilizacao)      |  |
|  +--------+---------+  +--------+---------+  +--------------------+  |
|           |                      |                                   |
|  +--------+----------------------+--------+                          |
|  |         tRPC Client (React Query)      |                          |
|  +--------+-------------------------------+                          |
+-----------|--------------------------------------------------------------+
            | HTTP/SSE
+-----------|--------------------------------------------------------------+
|  NEXT.JS 16 SERVER                                                       |
|  +--------+-------------------------------+                              |
|  |  App Router ([locale] / (auth) / (app))|                              |
|  +--------+-------------------------------+                              |
|           |                                                              |
|  +--------+-------------------------------+                              |
|  |  tRPC Server (packages/api)            |                              |
|  |  +----------+ +----------+ +--------+  |                              |
|  |  | auth     | | restaurant| | ai    |  |                              |
|  |  | user     | | review    | | admin |  |                              |
|  |  | menu     | | reservation| | verif|  |                              |
|  |  +----------+ +----------+ +--------+  |                              |
|  +--------+-------------------------------+                              |
|           |             |            |                                    |
+-----------+-------------+------------+------------------------------------+
            |             |            |
   +--------+--+  +-------+-----+  +--+------------+
   |PostgreSQL  |  | Claude API  |  | Ollama        |
   |17+pgvector |  | (Sonnet/    |  | (nomic-embed  |
   |            |  |  Opus)      |  |  -text-v2)    |
   |(packages/  |  |(packages/   |  |(packages/     |
   | db)        |  | ai)         |  | ai)           |
   +--------+---+  +------+------+  +---+-----------+
            |              |             |
            +--------------+-------------+
                           |
                  +--------+--------+
                  | packages/scoring|
                  | (Pontuacao de   |
                  |  Acessibilidade)|
                  +-----------------+
```

### 4.2 Diagrama de Fluxo de Dados

```
UTILIZADOR
    |
    | 1. "Restaurante italiano acessivel no Porto"
    v
+---+-------------------------------------------+
| NEXT.JS APP ROUTER                            |
| [locale]/search/page.tsx                      |
+---+-------------------------------------------+
    |
    | 2. tRPC mutation: ai.search
    v
+---+-------------------------------------------+
| tRPC ROUTER: ai.ts                            |
|                                               |
| 3. Claude interpreta query (tool use)         |
|    -> Extrai: cozinha=italiana,               |
|       localizacao=Porto,                      |
|       acessibilidade=sim                      |
+---+-------------------------------------------+
    |
    | 4. Gera embedding da query
    v
+---+-------------------------------------------+
| OLLAMA / API EMBEDDINGS                       |
| nomic-embed-text-v2                           |
| -> vector(1024)                               |
+---+-------------------------------------------+
    |
    | 5. Busca hibrida
    v
+---+-------------------------------------------+
| POSTGRESQL 17 + pgvector                      |
|                                               |
| 5a. Similaridade coseno (embedding)           |
| 5b. Full-text search (tsvector)               |
| 5c. Filtros SQL (localizacao, acessibilidade) |
| -> Top 20 resultados                          |
+---+-------------------------------------------+
    |
    | 6. Re-ranking com perfil do utilizador
    v
+---+-------------------------------------------+
| SCORING ENGINE (packages/scoring)             |
|                                               |
| Pondera por: largura_cadeira, has_ramp,       |
|   has_accessible_wc, door_width, etc.         |
| -> Top 20 re-ordenados                        |
+---+-------------------------------------------+
    |
    | 7. Claude gera resposta personalizada
    v
+---+-------------------------------------------+
| CLAUDE API (Sonnet 4.6)                       |
|                                               |
| Contexto: perfil utilizador + top resultados  |
| -> Resposta natural em portugues com          |
|    explicacao de cada recomendacao             |
+---+-------------------------------------------+
    |
    | 8. SSE streaming
    v
UTILIZADOR (ve resultados a aparecer em tempo real)
```

### 4.3 Diagrama de Deployment

```
+-----------------------------------------------+
|          DESENVOLVIMENTO (MacBook Air M1)      |
|                                                |
|  +------------------------------------------+  |
|  | Docker Desktop                            |  |
|  |  +----------+  +----------+  +--------+  |  |
|  |  |Next.js   |  |PostgreSQL|  |Ollama  |  |  |
|  |  |dev server|  |17+pgvec  |  |nomic-  |  |  |
|  |  |Turbopack |  |          |  |embed   |  |  |
|  |  |:3000     |  |:5432     |  |:11434  |  |  |
|  |  +----------+  +----------+  +--------+  |  |
|  +------------------------------------------+  |
|                                                |
|  Claude Code (CLI) + MCP Servers               |
|  pnpm + Turborepo                              |
+-----------------------------------------------+
            |
            | git push (GitHub)
            v
+-----------------------------------------------+
|          GITHUB ACTIONS (CI/CD)                |
|                                                |
|  1. Lint + Type Check                          |
|  2. Testes Unitarios (Vitest)                  |
|  3. Testes E2E (Playwright + axe-core)         |
|  4. Build Docker multi-arch (amd64 + arm64)    |
|  5. Push para ghcr.io                          |
|  6. Webhook para Coolify                       |
+-----------------------------------------------+
            |
            | deploy webhook
            v
+-----------------------------------------------+
|     PRODUCAO (Proxmox - Intel N5105 16GB)      |
|                                                |
|  +------------------------------------------+  |
|  | VM Debian 12 (12GB RAM)                   |  |
|  |                                           |  |
|  |  +--------------------------------------+ |  |
|  |  | Coolify (PaaS self-hosted)           | |  |
|  |  |                                      | |  |
|  |  |  +----------+  +---------+           | |  |
|  |  |  | Traefik  |  | Grafana |           | |  |
|  |  |  | (proxy)  |  | (monit.)|           | |  |
|  |  |  | :443     |  | :3001   |           | |  |
|  |  |  +----------+  +---------+           | |  |
|  |  |                                      | |  |
|  |  |  +----------+  +----------+          | |  |
|  |  |  |Next.js   |  |PostgreSQL|          | |  |
|  |  |  |producao  |  |17+pgvec  |          | |  |
|  |  |  |:3000     |  |:5432     |          | |  |
|  |  |  +----------+  +----------+          | |  |
|  |  |                                      | |  |
|  |  |  +----------+                        | |  |
|  |  |  |Ollama    |                        | |  |
|  |  |  |embeddings|                        | |  |
|  |  |  |:11434    |                        | |  |
|  |  |  +----------+                        | |  |
|  |  +--------------------------------------+ |  |
|  +------------------------------------------+  |
+-----------------------------------------------+
            |
            | HTTPS (Let's Encrypt via Traefik)
            v
        UTILIZADORES
```

### 4.4 Diagrama da Pipeline CI/CD

```
git push / PR
      |
      v
+-----+-------+
| ci.yml      |
+-----+-------+
      |
      +---> [lint-and-typecheck] --------+
      |     - pnpm install               |
      |     - eslint                     |
      |     - tsc --noEmit               |
      |     - prettier --check           |
      |     - markdownlint-cli2          |
      |                                  |
      |     Se falhar: PR bloqueado      |
      |                                  v
      +---> [test-unit] <--- depende --- +
      |     - vitest --coverage          |
      |     - Upload coverage artifact   |
      |                                  |
      +---> [test-e2e] <--- depende ---- +
            - PostgreSQL service         |
            - playwright install         |
            - pnpm build                 |
            - playwright test            |
            - axe-core a11y checks       |
            - Upload report se falhar    |
                                         |
                    +--------------------+
                    |
                    v
            [build-docker] (so em main)
            - docker buildx (amd64+arm64)
            - Push para ghcr.io
            - Tag: latest + SHA
                    |
                    v
            [deploy.yml] (webhook)
            - Notifica Coolify
            - Coolify faz pull da imagem
            - Zero-downtime deploy
```

---

## 5. Convencoes de Nomenclatura

### 5.1 Ficheiros e Directorios

| Contexto | Convencao | Exemplo |
|---|---|---|
| Ficheiros TypeScript gerais | `kebab-case.ts` | `health-check.ts`, `generate-embeddings.ts` |
| Componentes React | `kebab-case.tsx` (ficheiro), `PascalCase` (export) | `restaurant-card.tsx` exporta `RestaurantCard` |
| Componentes de pagina (Next.js) | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` | Convencao do App Router |
| Schemas Drizzle | `kebab-case.ts` (singular) | `restaurant.ts`, `accessibility.ts` |
| Testes | `{nome}.test.ts` ou `{nome}.spec.ts` | `scorer.test.ts`, `login.spec.ts` |
| Testes E2E Playwright | `{funcionalidade}.spec.ts` | `search-restaurant.spec.ts` |
| Configuracao | Nome padrao da ferramenta | `eslint.config.js`, `vitest.config.ts` |
| Variaveis de ambiente | `.env`, `.env.local`, `.env.test` | Nunca committed ao git |

### 5.2 Codigo TypeScript

| Contexto | Convencao | Exemplo |
|---|---|---|
| Variaveis e funcoes | `camelCase` | `getUserProfile`, `accessibilityScore` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_SEARCH_RESULTS`, `DEFAULT_LOCALE` |
| Tipos e Interfaces | `PascalCase` | `Restaurant`, `AccessibilityProfile` |
| Enums | `PascalCase` (nome), `PascalCase` (membros) | `MobilityType.ElectricWheelchair` |
| Componentes React | `PascalCase` | `RestaurantCard`, `AccessibilityBadge` |
| Custom hooks | `camelCase` com prefixo `use` | `useAccessibilityProfile`, `useDebounce` |
| Procedimentos tRPC | `camelCase` | `restaurant.getBySlug`, `ai.search` |
| Schemas Zod | `camelCase` com sufixo `Schema` | `createReviewSchema`, `searchQuerySchema` |

### 5.3 Base de Dados (PostgreSQL)

| Contexto | Convencao | Exemplo |
|---|---|---|
| Tabelas | `snake_case`, plural | `restaurants`, `accessibility_profiles` |
| Colunas | `snake_case` | `created_at`, `wheelchair_width` |
| Chaves primarias | `id` (UUID v7) | `id` |
| Chaves estrangeiras | `{entidade_singular}_id` | `restaurant_id`, `user_id` |
| Indices | `idx_{tabela}_{colunas}` | `idx_restaurants_location` |
| Enums PostgreSQL | `snake_case` | `mobility_type`, `price_range` |
| Booleanos | prefixo `has_` ou `is_` | `has_ramp`, `is_active` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` | Sempre com timezone (UTC) |

### 5.4 API (tRPC)

| Contexto | Convencao | Exemplo |
|---|---|---|
| Routers | `camelCase` (singular) | `restaurant`, `review`, `ai` |
| Procedures | `camelCase` (verbo + substantivo) | `getBySlug`, `createReview`, `searchRestaurants` |
| Input schemas | Zod com `camelCase` | `z.object({ restaurantId: z.string().uuid() })` |
| Erros | `TRPCError` com codigos HTTP semanticos | `throw new TRPCError({ code: "NOT_FOUND" })` |

### 5.5 Git

**Branches:**

| Tipo | Formato | Exemplo |
|---|---|---|
| Principal | `main` | `main` |
| Desenvolvimento | `develop` | `develop` |
| Feature | `feat/{scope}/{descricao}` | `feat/web/search-natural-language` |
| Correccao | `fix/{scope}/{descricao}` | `fix/api/review-validation` |
| Acessibilidade | `a11y/{scope}/{descricao}` | `a11y/web/keyboard-navigation` |
| Documentacao | `docs/{descricao}` | `docs/api-reference` |

**Commits (Conventional Commits):**

```
<tipo>(<scope>): <descricao>

[corpo opcional]

[rodape opcional]
```

Exemplos:

```
feat(web): adicionar pesquisa em linguagem natural com Claude
fix(api): corrigir validacao de largura de porta na avaliacao
a11y(web): melhorar navegacao por teclado no mapa interactivo
docs(db): documentar esquema de perfil de acessibilidade
refactor(ai): extrair pipeline de embeddings para modulo separado
test(scoring): adicionar testes para ponderacao por cadeira electrica
```

---

## 6. Workflow de Desenvolvimento

### 6.1 Configuracao Inicial

```bash
# 1. Clonar o repositorio
git clone git@github.com:jpedrocr/eat-out-adviser.git
cd eat-out-adviser

# 2. Instalar dependencias (requer Node.js 22+ e pnpm 10+)
pnpm install

# 3. Copiar e configurar variaveis de ambiente
cp docker/.env.example .env.local

# 4. Iniciar servicos de infraestrutura (PostgreSQL + Ollama)
pnpm docker:up:dev

# 5. Executar migracoes da base de dados
pnpm db:push

# 6. Povoar a base de dados com dados iniciais
pnpm db:seed

# 7. Descarregar o modelo de embeddings no Ollama
docker exec -it eat-out-adviser-ollama-1 ollama pull nomic-embed-text-v2

# 8. Gerar embeddings iniciais
pnpm ai:embed

# 9. Verificar saude do sistema
pnpm ai:health

# 10. Iniciar o servidor de desenvolvimento
pnpm dev
```

A aplicacao estara disponivel em `http://localhost:3000`.

### 6.2 Desenvolvimento Local

```bash
# Iniciar todos os servicos em modo de desenvolvimento
pnpm dev

# Abrir Drizzle Studio para inspeccionar a base de dados
pnpm db:studio

# Executar linting com correccao automatica
pnpm lint:fix

# Verificar formatacao
pnpm format:check

# Corrigir formatacao
pnpm format
```

**Fluxo tipico de desenvolvimento:**

1. Criar branch a partir de `develop`: `git checkout -b feat/web/nova-funcionalidade`
2. Desenvolver com `pnpm dev` a correr (Turbopack com hot-reload)
3. Escrever testes junto com o codigo
4. Executar `pnpm lint` e `pnpm test` antes de commit
5. O `pre-commit` hook executa `lint-staged` automaticamente
6. O `commit-msg` hook valida o formato Conventional Commits
7. Criar PR para `develop`

### 6.3 Testes

```bash
# Testes unitarios (Vitest) com watch mode
pnpm test

# Testes unitarios com cobertura
pnpm test:coverage

# Testes end-to-end (Playwright)
pnpm test:e2e

# Testes de acessibilidade especificos (axe-core)
pnpm test:a11y

# Executar um teste E2E especifico
pnpm --filter web playwright test search-restaurant.spec.ts

# Ver relatorio visual do Playwright
pnpm --filter web playwright show-report
```

**Estrutura de testes recomendada:**

- Testes unitarios para logica de negocio (`packages/scoring/`, `packages/ai/`)
- Testes de integracao para routers tRPC (`packages/api/`)
- Testes E2E para fluxos de utilizador criticos (`apps/web/tests/e2e/`)
- Testes de acessibilidade automaticos com `@axe-core/playwright` em todas as paginas

### 6.4 Deploy

```bash
# Build local para verificacao
pnpm build

# Build Docker multi-arquitectura
pnpm docker:build

# Deploy automatico: merge para main acciona GitHub Actions
git checkout main
git merge develop
git push origin main
# -> ci.yml executa -> build-docker -> deploy.yml -> Coolify faz pull e deploy
```

**Deploy manual (emergencia):**

```bash
# SSH para o servidor de producao
ssh user@n5105-server

# Dentro do servidor, actualizar via Coolify CLI ou docker compose
cd /opt/coolify
docker compose pull app
docker compose up -d app
```

### 6.5 Utilizacao do Claude Code com o Projecto

O Claude Code esta configurado para trabalhar directamente com este projecto atraves de:

1. **`.claude/settings.json`** -- Permissoes granulares para comandos permitidos.
2. **Servidor MCP personalizado** (`mcp/`) -- Expoe funcionalidades da app como ferramentas.
3. **Memoria de projecto** (`.claude/projects/`) -- Contexto persistente entre sessoes.

**Exemplos de utilizacao:**

```bash
# Pedir ao Claude Code para gerar um componente acessivel
claude "Criar componente AccessibilityScore que mostra pontuacao com barra de progresso acessivel"

# Pedir para escrever testes
claude "Escrever testes unitarios para packages/scoring/src/calculator.ts"

# Pedir para analisar acessibilidade de uma pagina
claude "Analisar a pagina de detalhe de restaurante e sugerir melhorias de acessibilidade"

# Utilizar o servidor MCP para consultar dados
claude "Quais restaurantes no Porto tem pontuacao de acessibilidade acima de 80?"
```

**Servidores MCP recomendados para configurar:**

- `mcp-server-postgres` -- Acesso directo a base de dados do projecto
- `mcp-server-github` -- Gestao de issues e PRs via IA
- Servidor MCP personalizado (`mcp/`) -- Busca de restaurantes, calculo de scoring

---

## Documentos Relacionados

- **[TECH_STACK.md](TECH_STACK.md)** -- Decisoes tecnicas detalhadas e justificacao de cada tecnologia
- **[SPEC.md](SPEC.md)** -- Especificacao funcional completa da aplicacao
- **[DATA_MODEL.md](DATA_MODEL.md)** -- Modelo de dados PostgreSQL com esquemas Drizzle
- **[AI_FEATURES.md](AI_FEATURES.md)** -- Especificacao detalhada de funcionalidades de IA
