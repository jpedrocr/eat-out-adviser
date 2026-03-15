# Eat Out Adviser - Indice de Documentacao

**Projecto:** Plataforma open source de acessibilidade fisica para restaurantes em Portugal **Stack:** Next.js 16, tRPC, PostgreSQL 17 + pgvector, Drizzle ORM, Gemini API, Docker multi-arch **IA:** Google Gemini (3.1 Pro / 2.5 Flash) | Ollama (embeddings locais)

---

## Documentos do Projecto

### [SPEC.md](SPEC.md)

Especificacao completa da aplicacao. Define a visao, missao, problema, analise de mercado, personas de utilizador, requisitos funcionais e nao-funcionais, sistema de classificacao de acessibilidade, funcionalidades de IA, modelo de dados, arquitectura, internacionalizacao, modelo de negocio, roadmap, metricas de sucesso e riscos.

**Seccoes:** Resumo Executivo | Analise de Mercado | Personas | Requisitos Funcionais | Requisitos Nao-Funcionais | Classificacao de Acessibilidade | IA | Modelo de Dados | Arquitectura | i18n | Modelo de Negocio | Roadmap | Metricas | Riscos

---

### [TECH_STACK.md](TECH_STACK.md)

Relatorio tecnico com todas as tecnologias escolhidas e justificacoes. Cobre frontend, backend, integracao de IA, DevOps, qualidade de codigo e automacao CLI.

**Seccoes:** Frontend (Next.js 16, Radix UI, shadcn/ui, Tailwind CSS v4, PWA) | Backend (tRPC, PostgreSQL 17 + pgvector, Drizzle ORM, Better Auth, SSE) | IA (Gemini API, Vision, Embeddings, RAG) | DevOps (Docker multi-arch, Coolify, GitHub Actions) | Qualidade (ESLint 9, Prettier, Vitest, Playwright, axe-core) | CLI (pnpm, Turborepo, Claude Code)

> **Nota:** O documento original referencia Claude API como LLM. A decisao actual e usar **Gemini API** para todas as funcionalidades de IA em producao.

---

### [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

Estrutura completa de directorios do monorepo, descricao de cada pacote, conteudo dos ficheiros de configuracao, diagramas de arquitectura, convencoes de nomenclatura e workflow de desenvolvimento.

**Seccoes:** Estrutura de Directorios | Descricao de Directorios | Ficheiros de Configuracao | Diagramas de Arquitectura | Convencoes de Nomenclatura | Workflow de Desenvolvimento

---

### [DATA_MODEL.md](DATA_MODEL.md)

Especificacao do modelo de dados PostgreSQL com pgvector. Define 12 entidades principais (utilizadores, restaurantes, perfis de acessibilidade, pontuacoes, avaliacoes, fotos, ementas, reservas, etc.) com mapeamento para normas ADA, ISO 21542 e EAA.

**Seccoes:** Visao Geral | Convencoes e Tipos | Entidades | Diagrama ER | Indices e Performance | Migracoes | Seeding | Compatibilidade A11yJSON

---

### [API_SPEC.md](API_SPEC.md)

Especificacao tecnica da API tRPC com 9 routers principais. Define middleware stack, procedimentos, eventos em tempo real via SSE, integracoes externas e conformidade RGPD.

**Seccoes:** Arquitectura da API | Middleware Stack | Routers tRPC (auth, user, restaurant, review, menu, reservation, ai, verification, admin) | Eventos SSE | Integracoes Externas | Webhooks | Seguranca e RGPD

---

### [AI_FEATURES.md](AI_FEATURES.md)

Especificacao das funcionalidades de inteligencia artificial: pesquisa em linguagem natural, analise de fotografias com visao computacional, matching personalizado, sumarizacao, assistente conversacional, analise de ementas, geracao de relatorios e traducao automatica.

**Seccoes:** Pesquisa em Linguagem Natural | Analise de Fotografias | Matching Personalizado | Sumarizacao de Avaliacoes | Assistente Conversacional | Analise de Ementas | Relatorios de Acessibilidade | Traducao com IA | Servidor MCP | Pipeline de Embeddings

> **Nota:** O documento original referencia Claude API/Vision. A decisao actual e usar **Gemini API** (incluindo Gemini Vision) para todas estas funcionalidades.

---

### [ACCESSIBILITY_RATING.md](ACCESSIBILITY_RATING.md)

Sistema inovador de classificacao de acessibilidade fisica (0-100) personalizado ao perfil de cada utilizador. Considera tipos de mobilidade, equipamentos e necessidades individuais, alinhado com normas ADA, ISO 21542 e EAA.

**Seccoes:** Filosofia | Pontuacao Global (0-100) | Algoritmo de Calculo | Pontuacao Personalizada | Sistema Semaforo | Verificacao | Decay e Actualizacao | Matching com Perfil | Apresentacao Visual | Tabela de Medidas | Implementacao TypeScript

---

### [research/plataformas-acessibilidade-fisica-relatorio.md](research/plataformas-acessibilidade-fisica-relatorio.md)

Analise investigativa de 15+ plataformas internacionais de acessibilidade (AccessNow, Wheelmap, AXS Map, Jaccede, Euan's Guide, etc.). Compara caracteristicas, modelos de negocio, tecnologias e lacunas de mercado que o Eat Out Adviser pretende preencher.

**Seccoes:** Plataformas dedicadas a acessibilidade fisica | Analise comparativa | Lacunas de mercado

---

## Referencia Rapida: Gemini API

| Item                       | Valor                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| **Modelo estavel**         | Gemini 2.5 Pro (`gemini-2.5-pro`) - 1M tokens contexto               |
| **Modelo rapido**          | Gemini 2.5 Flash (`gemini-2.5-flash`) - 1M tokens contexto           |
| **Modelo frontier**        | Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`)                    |
| **Modelo frontier rapido** | Gemini 3 Flash Preview (`gemini-3-flash-preview`)                    |
| **Embeddings**             | Gemini Embedding 2 (multimodal)                                      |
| **SDK (TypeScript)**       | `@google/genai` v1.45.0+ (GA)                                        |
| **SDK deprecated**         | `@google/generative-ai` (descontinuado Nov 2025)                     |
| **Gemini CLI**             | `@google/gemini-cli` v0.23.0+ (open source, Apache 2.0)              |
| **Free tier**              | Gemini 2.5 Pro: ~60 RPM / 1000 RPD; Flash: ~20 RPD                   |
| **Capacidades**            | Vision, function calling, code execution, thinking, search grounding |
