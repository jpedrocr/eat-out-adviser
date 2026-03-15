# Eat Out Adviser - Relatorio Tecnico de Stack Tecnologica

**Data:** Marco de 2026 **Projecto:** Eat Out Adviser - Aplicacao full-stack com foco em acessibilidade para
recomendacao de restaurantes **Ambientes:** MacBook Air M1 16GB (desenvolvimento) | Proxmox em Intel N5105 16GB
(producao/self-hosting)

---

## Indice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Frontend](#2-frontend)
3. [Backend](#3-backend)
4. [Integracao de IA](#4-integracao-de-ia)
5. [DevOps e Infraestrutura](#5-devops-e-infraestrutura)
6. [Qualidade de Codigo](#6-qualidade-de-codigo)
7. [CLI e Automacao](#7-cli-e-automacao)
8. [Arquitectura do Sistema](#8-arquitectura-do-sistema)
9. [Fontes](#9-fontes)

---

## 1. Resumo Executivo

Este documento apresenta a stack tecnologica recomendada para o projecto Eat Out Adviser, uma aplicacao full-stack
centrada em acessibilidade que utiliza inteligencia artificial para recomendar restaurantes. Todas as escolhas foram
feitas tendo em conta:

- **Compatibilidade multi-arquitectura:** ARM64 (M1) e x86_64 (Intel N5105)
- **Operacao via CLI:** Todas as ferramentas sao automatizaveis sem interface grafica
- **Capacidades de IA de ponta:** Modelos Claude, embeddings, RAG e visao computacional
- **Self-hosting:** Independencia total de servicos cloud pagos para producao
- **Acessibilidade em primeiro lugar:** Componentes e testes centrados em WCAG

---

## 2. Frontend

### 2.1 Framework Principal: Next.js 16

**Versao:** Next.js 16.x (estavel, com Turbopack)

**Justificacao:**

- O Next.js 16 introduziu Cache Components, um novo modelo de programacao que tira partido do Partial Pre-Rendering
  (PPR) e `use cache` para navegacao instantanea
- Turbopack (estavel) oferece builds 2-5x mais rapidos que o Webpack, reduzindo significativamente o tempo de
  desenvolvimento
- Server Components e Server Actions permitem uma arquitectura hibrida eficiente, essencial para uma app que precisa de
  SSR para SEO e CSR para interactividade
- Ecossistema React e o maior do mercado, garantindo longevidade e acesso a talento
- Suporte nativo a TypeScript sem configuracao adicional
- E a framework full-stack mais adoptada em Marco de 2026, com documentacao extensa e comunidade activa

**Alternativas consideradas e rejeitadas:**

- **Remix:** Bom, mas ecossistema menor e menos recursos para acessibilidade
- **SvelteKit:** Excelente performance, mas ecossistema de componentes acessiveis menos maduro
- **Astro:** Optimo para sites estaticos, mas menos adequado para apps interactivas com IA

### 2.2 Biblioteca de Componentes UI: Radix UI + shadcn/ui

**Justificacao:**

- **Radix UI** e a biblioteca que melhor implementa acessibilidade nativa -- leitores de ecra e navegacao por teclado
  funcionam como nativo, sem esforco adicional do programador
- **shadcn/ui** combina Radix UI para acessibilidade com Tailwind CSS para estilizacao, oferecendo componentes copiados
  directamente para o projecto (nao e uma dependencia npm, e codigo proprio)
- Controlo total sobre o codigo dos componentes, essencial para personalizacao de funcionalidades de acessibilidade
  especificas (ex.: descricoes audio de restaurantes, contrastes elevados)
- Suporte completo a ARIA attributes, focus management, e keyboard navigation
- Comunidade muito activa com mais de 27.000 estrelas no GitHub

#### Complemento: React Aria (Adobe)

- Para componentes mais complexos que necessitem de tratamento avancado de acessibilidade (ex.: tabelas interactivas de
  menus, sliders de filtragem), React Aria da Adobe gere foco, atributos ARIA e estados de interaccao automaticamente
- Ideal como complemento ao shadcn/ui para casos especificos

### 2.3 Estilizacao: Tailwind CSS v4

**Justificacao:**

- Compilador novo em Rust (Lightning CSS) com builds 5x mais rapidos e builds incrementais 100x mais rapidos
  (microsegundos)
- Configuracao CSS-first com directivas `@theme` -- elimina ficheiro JavaScript de configuracao
- Deteccao automatica de conteudo sem configuracao
- Suporte nativo a funcionalidades CSS modernas (color-mix(), @layer, nesting)
- Ferramenta de migracao automatica (`npx @tailwindcss/upgrade`) cobre ~90% das alteracoes
- Perfeito para design system acessivel com variaveis CSS para temas de alto contraste

### 2.4 PWA (Progressive Web App)

**Ferramenta:** Serwist (sucessor do next-pwa)

**Justificacao:**

- Serwist e a ferramenta moderna que se integra limpo com Next.js 16
- Service Workers para funcionamento offline -- essencial para utilizadores que consultam informacao de restaurantes sem
  rede
- Web App Manifest para instalacao no ecra inicial em Android e iOS
- Push Notifications para alertas de novos restaurantes acessiveis
- Em Marco de 2026, todos os browsers principais suportam completamente as APIs PWA
- Workbox 7 integra nativamente com Next.js build pipelines

### 2.5 Design Responsivo Mobile-First

**Estrategia:**

- Tailwind CSS v4 com breakpoints mobile-first (`sm:`, `md:`, `lg:`)
- Container Queries para componentes adaptativos
- Testes com Playwright em viewports multiplos
- Touch targets minimos de 44x44px (WCAG 2.5.5)
- Suporte a gestos nativos via use-gesture

---

## 3. Backend

### 3.1 Framework API: Next.js API Routes + tRPC

**Justificacao:**

- **Next.js API Routes** permitem manter frontend e backend no mesmo projecto, simplificando deployment e
  desenvolvimento
- **tRPC** adiciona type-safety end-to-end entre cliente e servidor sem necessidade de esquema separado (como GraphQL)
  nem geracao de codigo
- Para operacoes pesadas de IA (RAG, processamento de imagens), utilizar Route Handlers com streaming
- Server Actions do Next.js 16 para mutacoes simples (formularios, favoritos)
- Elimina a necessidade de um backend separado em Python/Rust para a maioria dos casos de uso

#### Alternativa para microservicos de IA: FastAPI (Python)

- Se o processamento de IA necessitar de bibliotecas Python especificas (ex.: modelos de embedding locais com Ollama),
  um microservico FastAPI complementa o Next.js
- FastAPI tem performance comparavel ao Node.js para I/O e e 60-80% mais rapido em workloads de data science
- Documentacao automatica com OpenAPI/Swagger
- Async nativo com asyncio

### 3.2 Base de Dados: PostgreSQL 17 + pgvector

**Justificacao:**

- **PostgreSQL 17** e a base de dados relacional mais robusta e madura para self-hosting
- **pgvector** transforma PostgreSQL numa base de dados vectorial capaz, eliminando a necessidade de um sistema separado
  (Pinecone, Weaviate)
- Com indice HNSW, consulta 1M vectores em 5-20ms com 95%+ de recall
- pgvectorscale (Timescale) oferece 471 QPS a 99% recall em 50M vectores
- Uma unica base de dados para dados relacionais, JSON e embeddings vectoriais, com garantias transaccionais
- Para o Eat Out Adviser, o volume de dados (restaurantes, avaliacoes, embeddings) ficara bem abaixo de 1M registos,
  tornando pgvector perfeito
- Suporta distancia coseno, L2, e produto interno
- Funciona perfeitamente tanto em ARM64 (M1) como x86_64 (N5105)

### 3.3 ORM: Drizzle ORM

**Justificacao:**

- Abordagem code-first: esquemas definidos directamente em TypeScript, sem ficheiro de esquema separado nem passo de
  geracao
- Bundle ultra-leve (~7.4kb min+gzip) sem dependencias externas -- crucial para o N5105 com recursos limitados
- Alteracoes no esquema reflectem-se imediatamente na API do cliente (sem `npx prisma generate`)
- Queries SQL-like em TypeScript com type-safety total
- Funciona nativamente com edge runtimes e serverless
- Suporte completo a PostgreSQL e pgvector
- Migracoes geridas via CLI (`drizzle-kit`)

**Prisma foi considerado mas rejeitado porque:**

- Apesar do Prisma 7 (late 2025) ter eliminado o motor Rust e reduzido o bundle de ~14MB para ~1.6MB, o Drizzle continua
  mais leve
- O passo de geracao (`prisma generate`) adiciona friccao no ciclo de desenvolvimento
- Drizzle oferece queries mais proximas do SQL, dando mais controlo sobre performance

### 3.4 Autenticacao: Better Auth

**Justificacao:**

- Biblioteca TypeScript-first moderna, desenhada como evolucao do NextAuth/Auth.js
- Arquitectura de plugins extensivel: OAuth, autenticacao dois factores (2FA), passkeys
- Agnostico em relacao a base de dados -- funciona com PostgreSQL, MySQL, SQLite
- Self-hosted por natureza: e uma biblioteca, nao um servico -- controlo total sobre a infraestrutura de autenticacao
- Suporte nativo a Next.js
- Para o Eat Out Adviser: OAuth com Google/Apple para login facil + email/password como fallback
- Melhor opcao a longo prazo para funcionalidades como RBAC (admin, moderador, utilizador), MFA, e politicas de sessao
  personalizadas

**Auth.js (NextAuth) foi considerado mas rejeitado porque:**

- Sem 2FA, passkeys ou RBAC nativos
- Better Auth oferece funcionalidades mais avancadas out-of-the-box

### 3.5 Comunicacao em Tempo Real: Server-Sent Events (SSE)

**Justificacao:**

- SSE e uma API nativa do browser que permite push do servidor para o cliente sobre HTTP simples
- Sem bibliotecas adicionais no cliente, sem configuracao de servidor custom
- Perfeito para o caso de uso do Eat Out Adviser:
  - Notificacoes de novas avaliacoes de acessibilidade
  - Actualizacoes em tempo real de disponibilidade
  - Streaming de respostas de IA (recomendacoes)
- Funciona com Next.js Route Handlers nativamente
- Ideal para self-hosting (sem necessidade de infra WebSocket separada)
- Para futuras funcionalidades bidirecionais (chat em tempo real), WebSocket pode ser adicionado via Socket.io ou ws

---

## 4. Integracao de IA

### 4.1 LLM Principal: Claude API (Anthropic)

**Modelo recomendado:** Claude Sonnet 4.6 (melhor relacao custo/performance para producao) **Modelo premium:** Claude
Opus 4.5 (para tarefas que exijam raciocinio avancado)

**SDK:** `@anthropic-ai/sdk` (TypeScript)

**Justificacao:**

- Claude e o modelo lider em Marco de 2026 para coding, agentes e utilizacao de ferramentas
- Janela de contexto de 1M tokens (beta) no Sonnet 4.6 -- permite processar grandes quantidades de dados de restaurantes
  num unico pedido
- Suporte nativo a tool use para integrar funcionalidades custom (busca em base de dados, APIs externas de restaurantes)
- Web search integrado na API
- Preco competitivo para self-hosting de aplicacoes

**Casos de uso no Eat Out Adviser:**

- Processamento de linguagem natural para queries como "restaurante italiano acessivel a cadeira de rodas no centro de
  Lisboa"
- Geracao de descricoes de acessibilidade a partir de informacao estruturada
- Assistente conversacional para recomendacoes personalizadas
- Sumarizacao de avaliacoes de utilizadores

### 4.2 Visao por IA: Claude Vision

**Justificacao:**

- Claude Opus 4.5 tem capacidades de visao melhoradas em relacao aos predecessores
- Files API permite upload de imagens e referencia via file IDs nas chamadas API
- Integrado no mesmo SDK, sem necessidade de servico separado

**Casos de uso no Eat Out Adviser:**

- Analise de fotografias de restaurantes para avaliar acessibilidade (rampas, portas largas, casas de banho adaptadas)
- Leitura de menus em formato imagem para extraccao de informacao
- Verificacao de sinaletica de acessibilidade em fotografias
- Avaliacao da iluminacao e disposicao do espaco

### 4.3 Modelos de Embedding: Estrategia Hibrida

**Para producao (API):** Embeddings via Anthropic API ou OpenAI `text-embedding-3-small`

**Para self-hosting local:** Ollama + nomic-embed-text-v2

**Justificacao da estrategia hibrida:**

- **nomic-embed-text-v2** usa arquitectura Mixture-of-Experts (MoE) inovadora, activa apenas 305M de 475M parametros
  durante a inferencia -- eficiente para o N5105
- Suporte a mais de 100 idiomas, incluindo portugues
- Ollama gere o modelo localmente com API compativel com OpenAI -- sem custos de API
- Para o N5105 com 16GB RAM, modelos de embedding pequenos funcionam bem (all-MiniLM-L12-v2 com apenas 22M parametros
  como alternativa ultra-leve)

**Armazenamento:** Vectores guardados directamente em PostgreSQL via pgvector com indice HNSW

### 4.4 RAG (Retrieval Augmented Generation)

**Arquitectura:**

```plaintext
Utilizador -> Query
      |
      v
Embedding da Query (nomic-embed-text-v2 / API)
      |
      v
Busca Vectorial em pgvector (top-k resultados similares)
      |
      v
Busca Hibrida (vectorial + full-text PostgreSQL)
      |
      v
Contexto enriquecido com dados relacionais (localizacao, avaliacoes, horarios)
      |
      v
Claude API com contexto + instrucoes do sistema
      |
      v
Resposta personalizada ao utilizador
```

**Justificacao:**

- pgvector com HNSW para busca semantica rapida (<20ms para 1M vectores)
- Full-text search nativo do PostgreSQL (`tsvector`/`tsquery`) para busca lexica complementar
- Busca hibrida (semantic + lexical) melhora significativamente o recall
- Dados estruturados de restaurantes (horarios, morada, classificacao de acessibilidade) adicionados como contexto
  adicional
- Claude processa o contexto combinado e gera recomendacoes naturais em portugues

### 4.5 Algoritmos de Matching com IA

**Estrategia:**

1. **Perfil do utilizador:** Preferencias de acessibilidade, restricoes alimentares, localizacao, historico
2. **Perfil do restaurante:** Embeddings de descricoes + dados estruturados de acessibilidade
3. **Matching:** Similaridade coseno entre embedding do perfil e embeddings dos restaurantes, ponderada por filtros de
   acessibilidade
4. **Re-ranking com LLM:** Claude reordena os top-20 resultados com base em contexto conversacional
5. **Feedback loop:** Avaliacoes do utilizador ajustam pesos do matching

---

## 5. DevOps e Infraestrutura

### 5.1 Estrategia de Containers: Docker Multi-Arquitectura

**Justificacao:**

- Docker buildx com QEMU permite construir imagens `linux/amd64` (N5105) e `linux/arm64` (M1) a partir de qualquer
  maquina
- Manifest lists garantem que `docker pull` selecciona automaticamente a variante correcta
- Dockerfile unico com multi-stage build para todas as arquitecturas

**Estrutura de containers:**

```plaintext
eat-out-adviser/
  docker/
    Dockerfile.app          # Next.js app (multi-stage, multi-arch)
    Dockerfile.ollama       # Ollama para embeddings locais (opcional)
    docker-compose.yml      # Orquestracao completa
    docker-compose.dev.yml  # Override para desenvolvimento
```

**Imagens base recomendadas:**

- `node:22-alpine` para a aplicacao Next.js (suporte nativo multi-arch)
- `postgres:17-alpine` para PostgreSQL + pgvector
- `ollama/ollama` para inferencia local (se necessario)

### 5.2 Producao no Proxmox (Intel N5105)

**Opcao recomendada:** Docker numa VM Debian 12 minima

**Justificacao:**

- Proxmox desaconselha oficialmente Docker dentro de LXC containers devido a problemas com namespaces aninhados,
  limitacoes cgroup e drivers de armazenamento
- Uma VM Debian 12 minima oferece isolamento limpo do kernel e controlo total
- O N5105 com 16GB suporta confortavelmente: VM com 12GB RAM (PostgreSQL + Next.js + Ollama para embeddings)
- Proxmox 9.1 pode importar imagens OCI directamente como templates LXC, mas para Docker compose completo, a VM e mais
  estavel

**Alternativa:** Coolify como PaaS self-hosted

**Justificacao:**

- Coolify e o PaaS self-hosted mais popular em Marco de 2026 (50.000+ estrelas GitHub)
- Alternativa open-source e gratuita ao Vercel/Heroku/Netlify
- Usa Docker + Traefik (reverse proxy) + nixpacks
- Git integration para deploy automatico a partir do GitHub
- Monitorizacao integrada via Grafana
- 280+ templates de aplicacao one-click
- Gestao de bases de dados com backups automaticos
- Ideal para quem quer simplicidade de PaaS sem depender de cloud
- Funciona perfeitamente no N5105 com Docker

### 5.3 CI/CD: GitHub Actions

**Justificacao:**

- Runners ARM64 gratuitos e ilimitados para repositorios publicos
- Self-hosted runners podem correr no proprio N5105 para builds privados
- Integra nativamente com Docker buildx para imagens multi-arquitectura
- Workflows YAML sao 100% CLI-friendly e automatizaveis com IA
- Ecosistema de actions maduro para linting, testes, deploy

**Pipeline recomendada:**

```yaml
# .github/workflows/ci.yml
# 1. Lint & Type Check (Biome + TypeScript)
# 2. Unit Tests (Vitest)
# 3. E2E Tests (Playwright)
# 4. Build Docker multi-arch
# 5. Push para registry
# 6. Deploy via SSH/Coolify webhook
```

### 5.4 Monitorizacao

**Stack recomendada:** Better Stack (Uptime) + Sentry (Errors) + Coolify Grafana (Metricas)

**Alternativa totalmente self-hosted:**

- **Uptime Kuma** para monitorizacao de uptime (self-hosted, leve)
- **Sentry self-hosted** ou **GlitchTip** (alternativa leve) para tracking de erros
- **Grafana + Prometheus** via Coolify para metricas de sistema

---

## 6. Qualidade de Codigo

### 6.1 Linting e Formatacao: ESLint 9 (Flat Config) + Prettier

**Justificacao:**

- Apesar do Biome ser 10-25x mais rapido, o ESLint mantem-se como recomendacao porque:
  - **eslint-plugin-react-hooks** e essencial para Next.js e nao existe em Biome
  - **eslint-plugin-next** e critico para boas praticas Next.js
  - **eslint-plugin-jsx-a11y** e fundamental para o foco em acessibilidade deste projecto
  - Regras type-aware com @typescript-eslint nao estao disponiveis em Biome
- ESLint 9 com Flat Config elimina a complexidade do `.eslintrc` legado
- `eslint-config-prettier` desactiva regras conflituantes automaticamente
- Prettier trata exclusivamente da formatacao, com configuracao minima

**Configuracao adicional:**

- **markdownlint-cli2** para ficheiros Markdown (documentacao, README)
- **commitlint** com Conventional Commits para mensagens de commit padronizadas
- **lint-staged** + **Husky** para executar linting apenas nos ficheiros alterados em pre-commit

**Nota sobre Biome:** Para projectos futuros sem necessidade de plugins React/Next.js especificos, Biome sera a escolha
preferencial pela sua velocidade superior (10.000 ficheiros em 0.8s vs 45.2s no ESLint).

### 6.2 Testes

#### Testes Unitarios e de Integracao: Vitest

**Justificacao:**

- 2-3x mais rapido que Jest na execucao de testes
- Integracao nativa com Vite e Turbopack
- Compativel com a API do Jest (migracao facil)
- Suporte a React Testing Library para testes de componentes
- Coverage com v8 provider
- Watch mode com Hot Module Replacement
- Recomendado oficialmente pela documentacao do Next.js

#### Testes End-to-End: Playwright

**Justificacao:**

- Selectores baseados em acessibilidade (`getByRole`, `getByLabel`, `getByText`) criam testes resilientes que tambem
  validam acessibilidade
- Aria Snapshots permitem validar a arvore de acessibilidade contra templates YAML predefinidos
- Testes multi-browser (Chromium, Firefox, WebKit) e multi-viewport
- Integracao nativa com GitHub Actions
- API para testes de acessibilidade que detecta contraste de cor insuficiente, controlos sem labels, e IDs duplicados
- Em 2026, self-healing locators e AI-assisted testing sao tendencias activas no Playwright

#### Testes de Acessibilidade: axe-core + Playwright

**Justificacao:**

- **@axe-core/playwright** integra o motor axe directamente nos testes E2E
- Detecta automaticamente violacoes WCAG 2.1 AA e AAA
- Relatorios detalhados com sugestoes de correccao
- Executavel em CI/CD para prevenir regressoes de acessibilidade

### 6.3 Type Safety: TypeScript 5.x (Strict Mode)

**Justificacao:**

- Strict mode activado para maxima seguranca de tipos
- tRPC garante type-safety end-to-end (cliente <-> servidor)
- Drizzle ORM infere tipos directamente do esquema sem geracao
- Zod para validacao de dados em runtime (formularios, API inputs)
- TypeScript e o denominador comum que liga toda a stack

---

## 7. CLI e Automacao

### 7.1 Ferramentas CLI para Gestao da App

**Package manager:** pnpm

**Justificacao:**

- Mais eficiente para monorepos com node_modules baseados em symlinks
- Rapido, determinista, e economiza espaco em disco
- Suporte nativo a workspaces

**Monorepo (opcional):** Turborepo

**Justificacao:**

- Cache inteligente: reutiliza resultados de tasks (builds, testes) se nada mudou
- Tasks paralelas automaticas para tasks independentes
- Integra com pnpm workspaces
- Ideal se o projecto crescer para multiplas apps (ex.: app principal + backoffice admin)

**Scripts CLI personalizados:**

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . && prettier --check .",
    "lint:fix": "eslint --fix . && prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test --grep @accessibility",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "docker:build": "docker buildx build --platform linux/amd64,linux/arm64 .",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "ai:embed": "tsx scripts/generate-embeddings.ts",
    "ai:seed": "tsx scripts/seed-restaurants.ts"
  }
}
```

### 7.2 Workflow de Desenvolvimento Assistido por IA

**Ferramenta principal:** Claude Code (CLI)

**Justificacao:**

- Claude Code e a CLI oficial da Anthropic para desenvolvimento assistido por IA
- Funciona inteiramente no terminal, sem GUI
- Suporta leitura e edicao de ficheiros, execucao de comandos, e interaccao com Git
- Ideal para automacao de tarefas repetitivas:
  - Geracao de componentes acessiveis
  - Escrita de testes
  - Refactoring
  - Revisao de codigo
  - Debug

### 7.3 Integracao MCP (Model Context Protocol)

**Justificacao:**

- MCP e o protocolo aberto (criado pela Anthropic em Novembro 2024) que padroniza a integracao entre LLMs e fontes de
  dados/ferramentas externas
- Em Marco de 2026, MCP e production-ready com mais de 1.000 servidores comunitarios
- OpenAI, Google, e outros adoptaram o protocolo
- Roadmap 2026 foca em enterprise readiness, audit trails, e SSO

**Servidores MCP relevantes para o projecto:**

| Servidor MCP            | Utilizacao                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `mcp-server-postgres`   | Claude Code acede directamente a base de dados do projecto |
| `mcp-server-github`     | Gestao de issues, PRs, e releases via IA                   |
| `mcp-server-filesystem` | Acesso ao sistema de ficheiros para automacao              |
| `mcp-server-fetch`      | Acesso a APIs externas de restaurantes                     |
| Servidor MCP custom     | Expor funcionalidades da app ao Claude Code                |

**Servidor MCP personalizado para o Eat Out Adviser:**

- Expor endpoints de busca de restaurantes como ferramentas MCP
- Permitir ao Claude Code (ou outros agentes) consultar a base de dados de acessibilidade directamente
- Integrar com APIs de mapas e transporte publico acessivel

---

## 8. Arquitectura do Sistema

### 8.1 Visao Geral

```plaintext
                    +------------------+
                    |   Browser/PWA    |
                    |  (Next.js CSR)   |
                    +--------+---------+
                             |
                    +--------+---------+
                    |   Next.js 16     |
                    |  (SSR + API)     |
                    |  + tRPC          |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
    +---------+----+ +------+------+ +-----+-------+
    | PostgreSQL   | | Claude API  | | Ollama      |
    | 17 +         | | (Sonnet/    | | (embeddings |
    | pgvector     | |  Opus)      | |  locais)    |
    +--------------+ +-------------+ +-------------+
```

### 8.2 Stack Completa Resumida

| Camada              | Tecnologia                   | Versao                |
| ------------------- | ---------------------------- | --------------------- |
| **Runtime**         | Node.js                      | 22 LTS                |
| **Framework**       | Next.js                      | 16.x                  |
| **Linguagem**       | TypeScript                   | 5.x (strict)          |
| **UI Components**   | shadcn/ui + Radix UI         | latest                |
| **Estilizacao**     | Tailwind CSS                 | 4.x                   |
| **PWA**             | Serwist                      | latest                |
| **API**             | tRPC                         | latest                |
| **ORM**             | Drizzle ORM                  | latest                |
| **Base de Dados**   | PostgreSQL + pgvector        | 17.x                  |
| **Autenticacao**    | Better Auth                  | latest                |
| **Tempo Real**      | Server-Sent Events           | nativo                |
| **LLM**             | Claude API (Anthropic)       | Sonnet 4.6 / Opus 4.5 |
| **Visao IA**        | Claude Vision                | integrado             |
| **Embeddings**      | nomic-embed-text-v2 (Ollama) | latest                |
| **RAG**             | pgvector + Claude            | custom                |
| **Containers**      | Docker + docker compose      | latest                |
| **PaaS**            | Coolify (self-hosted)        | latest                |
| **CI/CD**           | GitHub Actions               | latest                |
| **Monitorizacao**   | Uptime Kuma + GlitchTip      | latest                |
| **Linting**         | ESLint 9 + Prettier          | latest                |
| **Markdown Lint**   | markdownlint-cli2            | latest                |
| **Testes Unit**     | Vitest + Testing Library     | latest                |
| **Testes E2E**      | Playwright                   | latest                |
| **Testes A11y**     | axe-core + Playwright        | latest                |
| **Package Manager** | pnpm                         | latest                |
| **Monorepo**        | Turborepo                    | latest                |
| **Dev IA**          | Claude Code (CLI)            | latest                |
| **Protocolo IA**    | MCP                          | spec 2025-11-25       |

### 8.3 Requisitos de Hardware

**Desenvolvimento (MacBook Air M1 16GB):**

- Next.js dev server com Turbopack: ~1-2GB RAM
- PostgreSQL local: ~256MB RAM
- Docker Desktop: ~2-4GB RAM
- Ollama (embedding): ~2-4GB RAM
- Total estimado: ~8-10GB RAM (confortavel com 16GB)

**Producao (Proxmox Intel N5105 16GB):**

- VM Debian 12: ~512MB base
- PostgreSQL 17 + pgvector: ~1-2GB RAM
- Next.js em producao (Node.js): ~512MB-1GB RAM
- Ollama (embedding only, modelo pequeno): ~2-4GB RAM
- Coolify + Traefik: ~512MB RAM
- Total estimado: ~5-8GB RAM (confortavel com 12GB alocados a VM)

---

## 9. Fontes

### Frontend

- [Next.js - The React Framework](https://nextjs.org/)
- [Best Web Development Frameworks in 2026](https://www.intosoft.com/blog/best-web-development-frameworks-2026)
- [JavaScript Framework Trends in 2026](https://www.nucamp.co/blog/javascript-framework-trends-in-2026-what-s-new-in-react-next.js-vue-angular-and-svelte)
- [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026)
- [14 Best React UI Component Libraries in 2026](https://www.untitledui.com/blog/react-component-libraries)
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS v4 2026: Migration Best Practices](https://www.digitalapplied.com/blog/tailwind-css-v4-2026-migration-best-practices)
- [Build a Next.js 16 PWA with true offline support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)

### Backend

- [12 Best Backend Frameworks to Use in 2026](https://www.index.dev/blog/best-backend-frameworks-ranked)
- [Top 10 API Frameworks 2026](https://www.digitalapi.ai/blogs/top-10-api-frameworks-choose-your-best-fit-for-2026)
- [pgvector Guide: Vector Search and RAG in PostgreSQL](https://encore.dev/blog/you-probably-dont-need-a-vector-database)
- [pgvector: Key features, tutorial, and pros and cons 2026](https://www.instaclustr.com/education/vector-database/pgvector-key-features-tutorial-and-pros-and-cons-2026-guide/)
- [Drizzle ORM vs Prisma 2026](https://www.bytebase.com/blog/drizzle-vs-prisma/)
- [Better Auth vs NextAuth vs Clerk 2026](https://supastarter.dev/blog/better-auth-vs-nextauth-vs-clerk)
- [Comparing Open-Source Auth Libraries in 2026](https://www.better-stack.ai/p/blog/open-source-auth-libraries-in-2026)
- [Next.js Real-Time Chat: WebSocket and SSE](https://eastondev.com/blog/en/posts/dev/20260107-nextjs-realtime-chat/)
- [Server-Sent Events vs WebSockets 2026](https://www.nimbleway.com/blog/server-sent-events-vs-websockets-what-is-the-difference-2026-guide)

### IA

- [Claude API Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Claude Vision Documentation](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Anthropic Release Notes March 2026](https://releasebot.io/updates/anthropic)
- [The Best Open-Source Embedding Models in 2026](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models)
- [Best Embedding Models 2026: Complete Comparison Guide](https://www.openxcell.com/blog/best-embedding-models/)
- [Ollama Setup 2026 - Local LLM Guide](https://www.sitepoint.com/ollama-setup-guide-2026/)
- [Best Mini PC for Ollama and Local LLMs in 2026](https://www.mayhemcode.com/2026/02/best-mini-pc-for-ollama-and-local-llms.html)

### DevOps

- [How to Build Multi-Architecture Docker Images](https://oneuptime.com/blog/post/2026-01-06-docker-multi-architecture-images/view)
- [Docker Multi-Platform Docs](https://docs.docker.com/build/building/multi-platform/)
- [Proxmox VE 9.1 Docker Hub Support](https://www.xda-developers.com/proxmox-ve-can-pull-container-images-straight-from-docker-hub/)
- [Coolify - Self-Hosted PaaS](https://coolify.io/)
- [Best Self-Hosted Deployment Platforms 2026](https://servercompass.app/blog/best-self-hosted-deployment-platforms-2026)
- [GitHub Actions ARM64 Runners](https://dev.to/github/speed-up-your-cicd-arm-64-runners-for-github-actions-21g8)
- [Self-Hosting GitHub Actions Runners](https://www.warpbuild.com/blog/self-hosting-github-actions)

### Qualidade de Codigo

- [Biome Migration Guide 2026](https://dev.to/pockit_tools/biome-the-eslint-and-prettier-killer-complete-migration-guide-for-2026-27m)
- [ESLint Flat Config with TypeScript](https://oneuptime.com/blog/post/2026-02-03-eslint-prettier-typescript/view)
- [Next.js Vitest Testing](https://nextjs.org/docs/app/guides/testing/vitest)
- [JavaScript Testing Complete Guide 2026](https://calmops.com/programming/javascript/javascript-testing-guide-2026/)
- [Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

### MCP e Automacao

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [2026 MCP Roadmap](http://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)
- [MCP 2026 Complete Guide](https://calmops.com/ai/model-context-protocol-mcp-2026-complete-guide/)
- [Monorepo Tools 2026: Turborepo vs Nx](https://viadreams.cc/en/blog/monorepo-tools-2026/)
