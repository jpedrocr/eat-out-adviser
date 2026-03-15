# Eat Out Adviser - Especificacao da API

**Data:** Marco de 2026 **Projecto:** Eat Out Adviser - API tRPC para plataforma de recomendacao de restaurantes com foco em acessibilidade **Stack:** Next.js 16 + tRPC + PostgreSQL 17 + pgvector + Drizzle ORM + Better Auth + Claude API **Normas:** ADA, ISO 21542:2021, EAA, RGPD, WCAG 2.1 AA

---

## Indice

1. [Arquitectura da API](#1-arquitectura-da-api)
2. [Middleware Stack](#2-middleware-stack)
3. [Routers tRPC](#3-routers-trpc)
   - 3.1 [auth](#31-auth-router)
   - 3.2 [user](#32-user-router)
   - 3.3 [restaurant](#33-restaurant-router)
   - 3.4 [review](#34-review-router)
   - 3.5 [menu](#35-menu-router)
   - 3.6 [reservation](#36-reservation-router)
   - 3.7 [ai](#37-ai-router)
   - 3.8 [verification](#38-verification-router)
   - 3.9 [admin](#39-admin-router)
4. [Eventos em Tempo Real (SSE)](#4-eventos-em-tempo-real-sse)
5. [Integracoes com APIs Externas](#5-integracoes-com-apis-externas)
6. [Webhook Endpoints](#6-webhook-endpoints)
7. [Seguranca e RGPD](#7-seguranca-e-rgpd)

---

## 1. Arquitectura da API

### 1.1 Estrutura de Routers

```plaintext
src/server/
  trpc.ts                    # Inicializacao do tRPC, contexto, middleware base
  routers/
    _app.ts                  # Router raiz (appRouter) que agrega todos os sub-routers
    auth.ts                  # Autenticacao e sessoes
    user.ts                  # Perfil de utilizador e preferencias
    restaurant.ts            # CRUD de restaurantes e acessibilidade
    review.ts                # Avaliacoes e moderacao
    menu.ts                  # Ementas e pratos
    reservation.ts           # Reservas
    ai.ts                    # Funcionalidades de IA (RAG, Vision, chat)
    verification.ts          # Relatorios de verificacao de acessibilidade
    admin.ts                 # Painel de administracao
  middleware/
    auth.ts                  # Verificacao de autenticacao (Better Auth)
    rateLimit.ts             # Rate limiting por categoria
    roles.ts                 # Verificacao de papeis (RBAC)
    logging.ts               # Registo de pedidos e erros
```

### 1.2 Router Raiz

```typescript
// src/server/routers/_app.ts
import { router } from "../trpc";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { restaurantRouter } from "./restaurant";
import { reviewRouter } from "./review";
import { menuRouter } from "./menu";
import { reservationRouter } from "./reservation";
import { aiRouter } from "./ai";
import { verificationRouter } from "./verification";
import { adminRouter } from "./admin";

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  restaurant: restaurantRouter,
  review: reviewRouter,
  menu: menuRouter,
  reservation: reservationRouter,
  ai: aiRouter,
  verification: verificationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
```

### 1.3 Contexto tRPC

```typescript
// src/server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { type Session } from "better-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/db";

export interface Context {
  db: typeof db;
  session: Session | null;
  userId: string | null;
  userRole: "user" | "owner" | "verifier" | "admin";
  ip: string;
  userAgent: string;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
```

### 1.4 Tratamento de Erros

Todos os erros seguem o formato padrao do tRPC com codigos HTTP mapeados:

| Codigo tRPC             | HTTP | Utilizacao                              |
| ----------------------- | ---- | --------------------------------------- |
| `BAD_REQUEST`           | 400  | Input invalido (falha de validacao Zod) |
| `UNAUTHORIZED`          | 401  | Sessao expirada ou ausente              |
| `FORBIDDEN`             | 403  | Sem permissao para o recurso            |
| `NOT_FOUND`             | 404  | Recurso inexistente                     |
| `CONFLICT`              | 409  | Duplicacao (ex.: email ja registado)    |
| `TOO_MANY_REQUESTS`     | 429  | Rate limit excedido                     |
| `INTERNAL_SERVER_ERROR` | 500  | Erro inesperado do servidor             |

```typescript
// Exemplo de erro estruturado
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Restaurante nao encontrado.",
  cause: { restaurantId: input.id },
});
```

### 1.5 Versionamento

A API nao utiliza versionamento explicito no path (ex.: `/v1/`). O tRPC garante compatibilidade via type-safety entre cliente e servidor. Alteracoes incompativeis sao geridas por:

- Deprecacao gradual de campos (manter campo antigo + adicionar novo)
- Feature flags para funcionalidades experimentais
- Changelog documentado no repositorio

### 1.6 Rate Limiting Global

| Categoria           | Limite      | Janela   |
| ------------------- | ----------- | -------- |
| Publico (sem auth)  | 30 pedidos  | 1 minuto |
| Autenticado         | 120 pedidos | 1 minuto |
| Escrita (mutations) | 30 pedidos  | 1 minuto |
| IA (ai router)      | 10 pedidos  | 1 minuto |
| Upload de ficheiros | 5 pedidos   | 1 minuto |
| Admin               | 300 pedidos | 1 minuto |

---

## 2. Middleware Stack

A ordem de execucao dos middleware e determinante. Cada pedido tRPC atravessa a seguinte cadeia:

```plaintext
Pedido HTTP
  -> CORS (Next.js config)
  -> Rate Limiting (por IP + userId)
  -> Contexto (sessao Better Auth + dados do utilizador)
  -> Input Validation (Zod - automatico pelo tRPC)
  -> Autorizacao (papel do utilizador)
  -> Handler (logica de negocio)
  -> Logging (resultado + tempo de execucao)
  -> Resposta
```

### 2.1 Middleware de Autenticacao

```typescript
// src/server/middleware/auth.ts
import { middleware, TRPCError } from "../trpc";
import { auth } from "@/lib/auth"; // Better Auth instance

export const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sessao invalida. Inicie sessao para continuar.",
    });
  }
  return next({ ctx: { session: ctx.session, userId: ctx.userId } });
});

export const authenticatedProcedure = publicProcedure.use(isAuthenticated);
```

### 2.2 Middleware de Papeis (RBAC)

```typescript
// src/server/middleware/roles.ts
import { middleware, TRPCError } from "../trpc";

type Role = "user" | "owner" | "verifier" | "admin";

export const requireRole = (...roles: Role[]) =>
  middleware(async ({ ctx, next }) => {
    if (!roles.includes(ctx.userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Sem permissao para esta operacao.",
      });
    }
    return next({ ctx });
  });

export const ownerProcedure = authenticatedProcedure.use(requireRole("owner", "admin"));
export const adminProcedure = authenticatedProcedure.use(requireRole("admin"));
export const verifierProcedure = authenticatedProcedure.use(requireRole("verifier", "admin"));
```

### 2.3 Middleware de Rate Limiting

```typescript
// src/server/middleware/rateLimit.ts
import { middleware, TRPCError } from "../trpc";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
// Alternativa self-hosted: implementacao com Map() em memoria
// ou rate-limiter-flexible com PostgreSQL

type RateLimitTier = "public" | "authenticated" | "write" | "ai" | "upload" | "admin";

const limits: Record<RateLimitTier, { requests: number; window: string }> = {
  public: { requests: 30, window: "1m" },
  authenticated: { requests: 120, window: "1m" },
  write: { requests: 30, window: "1m" },
  ai: { requests: 10, window: "1m" },
  upload: { requests: 5, window: "1m" },
  admin: { requests: 300, window: "1m" },
};

export const rateLimit = (tier: RateLimitTier) =>
  middleware(async ({ ctx, next }) => {
    const identifier = ctx.userId ?? ctx.ip;
    const config = limits[tier];

    // Verificacao de rate limit (implementacao simplificada)
    const { success, remaining, reset } = await checkRateLimit(identifier, config);

    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiados pedidos. Tente novamente em ${reset} segundos.`,
      });
    }

    return next({ ctx });
  });
```

### 2.4 Middleware de Logging

```typescript
// src/server/middleware/logging.ts
import { middleware } from "../trpc";

export const withLogging = middleware(async ({ path, type, ctx, next }) => {
  const start = Date.now();
  const result = await next({ ctx });
  const duration = Date.now() - start;

  console.log({
    path,
    type,
    userId: ctx.userId,
    duration: `${duration}ms`,
    ok: result.ok,
  });

  return result;
});
```

### 2.5 Configuracao CORS

```typescript
// next.config.ts (extracto)
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGIN ?? "https://eatoutadviser.pt" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};
```

---

## 3. Routers tRPC

### Schemas Zod Partilhados

```typescript
// src/server/schemas/shared.ts
import { z } from "zod";

export const paginationInput = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const paginatedOutput = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().uuid().nullable(),
    totalCount: z.number().int(),
  });

export const sortOrder = z.enum(["asc", "desc"]).default("desc");

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const multilingualText = z.record(z.enum(["pt", "en", "es", "fr"]), z.string());
```

---

### 3.1 Auth Router

O router `auth` actua como camada fina sobre o Better Auth, expondo operacoes de autenticacao via tRPC para manter a consistencia da API.

#### `auth.register`

| Campo            | Valor                                                                |
| ---------------- | -------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                           |
| **Autenticacao** | Publica                                                              |
| **Rate limit**   | `write` (30/min)                                                     |
| **Descricao**    | Regista um novo utilizador com email/password ou inicia fluxo OAuth. |

```typescript
// Input
const registerInput = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("credentials"),
    email: z.string().email("Email invalido."),
    password: z.string().min(8, "Password deve ter no minimo 8 caracteres.").regex(/[A-Z]/, "Deve conter pelo menos uma letra maiuscula.").regex(/[0-9]/, "Deve conter pelo menos um numero."),
    name: z.string().min(2).max(255),
    locale: z.enum(["pt", "en", "es", "fr"]).default("pt"),
  }),
  z.object({
    method: z.literal("oauth"),
    provider: z.enum(["google", "apple"]),
    redirectUrl: z.string().url().optional(),
  }),
]);

// Output
const registerOutput = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    locale: z.string(),
  }),
  session: z.object({
    token: z.string(),
    expiresAt: z.date(),
  }),
});
```

**Exemplo de pedido:**

```typescript
const result = await trpc.auth.register.mutate({
  method: "credentials",
  email: "joao@example.com",
  password: "MinhaPassword1",
  name: "Joao Pedro",
  locale: "pt",
});
```

**Exemplo de resposta:**

```json
{
  "user": {
    "id": "019505a0-7c1e-7000-8000-1a2b3c4d5e6f",
    "email": "joao@example.com",
    "name": "Joao Pedro",
    "locale": "pt"
  },
  "session": {
    "token": "sess_abc123...",
    "expiresAt": "2026-03-22T12:00:00.000Z"
  }
}
```

**Erros:**

| Codigo        | Condicao                       |
| ------------- | ------------------------------ |
| `CONFLICT`    | Email ja registado             |
| `BAD_REQUEST` | Password nao cumpre requisitos |

---

#### `auth.login`

| Campo            | Valor                                      |
| ---------------- | ------------------------------------------ |
| **Tipo**         | `mutation`                                 |
| **Autenticacao** | Publica                                    |
| **Rate limit**   | `write` (30/min)                           |
| **Descricao**    | Inicia sessao com email/password ou OAuth. |

```typescript
const loginInput = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("credentials"),
    email: z.string().email(),
    password: z.string(),
  }),
  z.object({
    method: z.literal("oauth"),
    provider: z.enum(["google", "apple"]),
    redirectUrl: z.string().url().optional(),
  }),
]);

const loginOutput = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(["user", "owner", "verifier", "admin"]),
  }),
  session: z.object({
    token: z.string(),
    expiresAt: z.date(),
  }),
});
```

**Erros:**

| Codigo         | Condicao              |
| -------------- | --------------------- |
| `UNAUTHORIZED` | Credenciais invalidas |
| `NOT_FOUND`    | Conta nao encontrada  |

---

#### `auth.logout`

| Campo            | Valor                                       |
| ---------------- | ------------------------------------------- |
| **Tipo**         | `mutation`                                  |
| **Autenticacao** | Autenticado                                 |
| **Rate limit**   | `authenticated` (120/min)                   |
| **Descricao**    | Termina a sessao actual e invalida o token. |

```typescript
const logoutInput = z.void();
const logoutOutput = z.object({ success: z.literal(true) });
```

---

#### `auth.refreshSession`

| Campo            | Valor                                      |
| ---------------- | ------------------------------------------ |
| **Tipo**         | `mutation`                                 |
| **Autenticacao** | Autenticado                                |
| **Rate limit**   | `authenticated` (120/min)                  |
| **Descricao**    | Renova o token de sessao antes de expirar. |

```typescript
const refreshSessionOutput = z.object({
  session: z.object({
    token: z.string(),
    expiresAt: z.date(),
  }),
});
```

---

#### `auth.requestPasswordReset`

| Campo            | Valor                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                                                     |
| **Autenticacao** | Publica                                                                                                        |
| **Rate limit**   | `write` (30/min)                                                                                               |
| **Descricao**    | Envia email com link de reposicao de password. Responde sempre com sucesso para nao revelar se o email existe. |

```typescript
const requestPasswordResetInput = z.object({
  email: z.string().email(),
});

const requestPasswordResetOutput = z.object({
  message: z.string(), // "Se o email existir, enviamos instrucoes de recuperacao."
});
```

---

#### `auth.resetPassword`

| Campo            | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| **Tipo**         | `mutation`                                             |
| **Autenticacao** | Publica (com token de reset)                           |
| **Rate limit**   | `write` (30/min)                                       |
| **Descricao**    | Redefine a password usando o token recebido por email. |

```typescript
const resetPasswordInput = z.object({
  token: z.string(),
  newPassword: z.string().min(8).regex(/[A-Z]/, "Deve conter pelo menos uma letra maiuscula.").regex(/[0-9]/, "Deve conter pelo menos um numero."),
});

const resetPasswordOutput = z.object({ success: z.literal(true) });
```

**Erros:**

| Codigo        | Condicao                   |
| ------------- | -------------------------- |
| `BAD_REQUEST` | Token invalido ou expirado |

---

### 3.2 User Router

#### `user.getProfile`

| Campo            | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| **Tipo**         | `query`                                              |
| **Autenticacao** | Autenticado                                          |
| **Rate limit**   | `authenticated` (120/min)                            |
| **Descricao**    | Devolve o perfil completo do utilizador autenticado. |

```typescript
const userProfileOutput = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  locale: z.enum(["pt", "en", "es", "fr"]),
  avatarUrl: z.string().url().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  reviewCount: z.number().int(),
  photoCount: z.number().int(),
});
```

---

#### `user.updateProfile`

| Campo            | Valor                                                     |
| ---------------- | --------------------------------------------------------- |
| **Tipo**         | `mutation`                                                |
| **Autenticacao** | Autenticado                                               |
| **Rate limit**   | `write` (30/min)                                          |
| **Descricao**    | Actualiza dados basicos do perfil (nome, idioma, avatar). |

```typescript
const updateProfileInput = z.object({
  name: z.string().min(2).max(255).optional(),
  locale: z.enum(["pt", "en", "es", "fr"]).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const updateProfileOutput = userProfileOutput;
```

---

#### `user.getAccessibilityProfile`

| Campo            | Valor                                             |
| ---------------- | ------------------------------------------------- |
| **Tipo**         | `query`                                           |
| **Autenticacao** | Autenticado                                       |
| **Rate limit**   | `authenticated` (120/min)                         |
| **Descricao**    | Devolve o perfil de acessibilidade do utilizador. |

```typescript
const userAccessibilityProfileOutput = z.object({
  id: z.string().uuid(),
  mobilityType: z.enum(["electric_wheelchair", "manual_wheelchair", "walker", "crutches", "cane", "scooter", "none", "other"]),
  wheelchairWidth: z.number().nullable(),
  wheelchairLength: z.number().nullable(),
  turningRadiusNeeded: z.number().nullable(),
  maxRampIncline: z.number().nullable(),
  maxStepHeight: z.number().nullable(),
  needsElevator: z.boolean(),
  needsAccessibleBathroom: z.boolean(),
  bathroomTransferSide: z.enum(["left", "right", "both", "not_applicable"]),
  doorOpeningForceLimit: z.number().nullable(),
  companionCount: z.number().int().nullable(),
  dietaryRestrictions: z.array(z.string()).nullable(),
  allergies: z.array(z.string()).nullable(),
  preferredCuisines: z.array(z.string()).nullable(),
  maxDistanceFromParking: z.number().int().nullable(),
  otherNeeds: z.string().nullable(),
});
```

---

#### `user.updateAccessibilityProfile`

| Campo            | Valor                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                  |
| **Autenticacao** | Autenticado                                                                 |
| **Rate limit**   | `write` (30/min)                                                            |
| **Descricao**    | Cria ou actualiza o perfil de acessibilidade. Upsert (cria se nao existir). |

```typescript
const updateAccessibilityProfileInput = z.object({
  mobilityType: z.enum(["electric_wheelchair", "manual_wheelchair", "walker", "crutches", "cane", "scooter", "none", "other"]).optional(),
  wheelchairWidth: z.number().min(0).max(200).nullable().optional(),
  wheelchairLength: z.number().min(0).max(300).nullable().optional(),
  turningRadiusNeeded: z.number().min(0).max(500).nullable().optional(),
  maxRampIncline: z.number().min(0).max(30).nullable().optional(),
  maxStepHeight: z.number().min(0).max(50).nullable().optional(),
  needsElevator: z.boolean().optional(),
  needsAccessibleBathroom: z.boolean().optional(),
  bathroomTransferSide: z.enum(["left", "right", "both", "not_applicable"]).optional(),
  doorOpeningForceLimit: z.number().min(0).max(20).nullable().optional(),
  companionCount: z.number().int().min(0).max(20).nullable().optional(),
  dietaryRestrictions: z.array(z.string()).nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  preferredCuisines: z.array(z.string()).nullable().optional(),
  maxDistanceFromParking: z.number().int().min(0).max(5000).nullable().optional(),
  otherNeeds: z.string().max(2000).nullable().optional(),
});
```

**Exemplo de pedido:**

```typescript
await trpc.user.updateAccessibilityProfile.mutate({
  mobilityType: "electric_wheelchair",
  wheelchairWidth: 68,
  turningRadiusNeeded: 150,
  maxRampIncline: 8,
  maxStepHeight: 0,
  needsAccessibleBathroom: true,
  bathroomTransferSide: "right",
});
```

---

#### `user.getPreferences`

| Campo            | Valor                                            |
| ---------------- | ------------------------------------------------ |
| **Tipo**         | `query`                                          |
| **Autenticacao** | Autenticado                                      |
| **Rate limit**   | `authenticated` (120/min)                        |
| **Descricao**    | Devolve preferencias de notificacao e interface. |

```typescript
const preferencesOutput = z.object({
  notifications: z.object({
    newReviewOnMyRestaurant: z.boolean(),
    reservationUpdates: z.boolean(),
    accessibilityVerificationUpdates: z.boolean(),
    weeklyRecommendations: z.boolean(),
  }),
  interface: z.object({
    highContrast: z.boolean(),
    largeText: z.boolean(),
    reduceMotion: z.boolean(),
    screenReaderOptimized: z.boolean(),
  }),
});
```

---

#### `user.updatePreferences`

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Tipo**         | `mutation`                                         |
| **Autenticacao** | Autenticado                                        |
| **Rate limit**   | `write` (30/min)                                   |
| **Descricao**    | Actualiza preferencias de notificacao e interface. |

```typescript
const updatePreferencesInput = preferencesOutput.deepPartial();
```

---

#### `user.deleteAccount`

| Campo            | Valor                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                             |
| **Autenticacao** | Autenticado                                                                            |
| **Rate limit**   | `write` (30/min)                                                                       |
| **Descricao**    | Elimina a conta e todos os dados pessoais (RGPD Art. 17). Avaliacoes sao anonimizadas. |

```typescript
const deleteAccountInput = z.object({
  confirmationPhrase: z.literal("ELIMINAR CONTA"),
});

const deleteAccountOutput = z.object({
  success: z.literal(true),
  message: z.string(), // "Conta eliminada. Os seus dados serao removidos em 30 dias."
});
```

**Erros:**

| Codigo        | Condicao                        |
| ------------- | ------------------------------- |
| `BAD_REQUEST` | Frase de confirmacao incorrecta |

---

### 3.3 Restaurant Router

#### `restaurant.getById`

| Campo            | Valor                                             |
| ---------------- | ------------------------------------------------- |
| **Tipo**         | `query`                                           |
| **Autenticacao** | Publica                                           |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)    |
| **Descricao**    | Devolve todos os dados de um restaurante pelo ID. |

```typescript
const getByIdInput = z.object({
  id: z.string().uuid(),
});

const restaurantOutput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: multilingualText.nullable(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  district: z.string().nullable(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  website: z.string().url().nullable(),
  cuisineTypes: z.array(z.string()).nullable(),
  priceRange: z.enum(["budget", "moderate", "upscale", "fine_dining"]).nullable(),
  openingHours: z
    .record(
      z.string(),
      z.array(
        z.object({
          open: z.string(),
          close: z.string(),
        }),
      ),
    )
    .nullable(),
  capacity: z.number().int().nullable(),
  isClaimedByOwner: z.boolean(),
  status: z.enum(["pending", "active", "inactive", "archived"]),
  averageFoodRating: z.number().nullable(),
  averageServiceRating: z.number().nullable(),
  averageAccessibilityScore: z.number().nullable(),
  reviewCount: z.number().int(),
  photoCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

**Exemplo de resposta:**

```json
{
  "id": "019505a0-7c1e-7000-8000-aabb11223344",
  "name": "Trattoria da Maria",
  "slug": "trattoria-da-maria-porto",
  "description": {
    "pt": "Cozinha italiana autentica no coracao do Porto.",
    "en": "Authentic Italian cuisine in the heart of Porto."
  },
  "address": "Rua das Flores 123",
  "city": "Porto",
  "postalCode": "4050-262",
  "district": "Porto",
  "country": "PT",
  "latitude": 41.1496,
  "longitude": -8.6109,
  "phone": "+351 222 123 456",
  "cuisineTypes": ["italiana", "mediterranea"],
  "priceRange": "moderate",
  "averageAccessibilityScore": 4.2,
  "reviewCount": 38,
  "photoCount": 12,
  "status": "active"
}
```

---

#### `restaurant.getBySlug`

| Campo            | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| **Tipo**         | `query`                                              |
| **Autenticacao** | Publica                                              |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)       |
| **Descricao**    | Devolve um restaurante pelo slug (para URLs amigas). |

```typescript
const getBySlugInput = z.object({
  slug: z.string().min(1).max(255),
});
// Output: restaurantOutput (mesmo schema)
```

---

#### `restaurant.list`

| Campo            | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| **Tipo**         | `query`                                                |
| **Autenticacao** | Publica                                                |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)         |
| **Descricao**    | Lista restaurantes com paginacao, filtros e ordenacao. |

```typescript
const listInput = z.object({
  ...paginationInput.shape,
  filters: z
    .object({
      city: z.string().optional(),
      district: z.string().optional(),
      cuisineTypes: z.array(z.string()).optional(),
      priceRange: z.array(z.enum(["budget", "moderate", "upscale", "fine_dining"])).optional(),
      status: z.enum(["active", "pending"]).default("active"),
      minAccessibilityScore: z.number().min(0).max(5).optional(),
      hasRamp: z.boolean().optional(),
      hasAccessibleBathroom: z.boolean().optional(),
      hasParking: z.boolean().optional(),
      minDoorWidthCm: z.number().optional(),
    })
    .optional(),
  sortBy: z.enum(["name", "averageAccessibilityScore", "averageFoodRating", "reviewCount", "distance", "createdAt"]).default("averageAccessibilityScore"),
  sortOrder,
});

// Output: paginatedOutput(restaurantOutput)
```

---

#### `restaurant.search`

| Campo            | Valor                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| **Tipo**         | `query`                                                                         |
| **Autenticacao** | Publica                                                                         |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)                                  |
| **Descricao**    | Pesquisa textual em nome, descricao e morada (full-text PostgreSQL `tsvector`). |

```typescript
const searchInput = z.object({
  query: z.string().min(2).max(200),
  ...paginationInput.shape,
  city: z.string().optional(),
});

// Output: paginatedOutput(restaurantOutput) com campo adicional
const searchResultItem = restaurantOutput.extend({
  relevanceScore: z.number(),
});
```

---

#### `restaurant.getNearby`

| Campo            | Valor                                                            |
| ---------------- | ---------------------------------------------------------------- |
| **Tipo**         | `query`                                                          |
| **Autenticacao** | Publica                                                          |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)                   |
| **Descricao**    | Devolve restaurantes proximos a coordenadas (formula Haversine). |

```typescript
const getNearbyInput = z.object({
  ...coordinatesSchema.shape,
  radiusKm: z.number().min(0.1).max(50).default(5),
  limit: z.number().int().min(1).max(50).default(20),
  minAccessibilityScore: z.number().min(0).max(5).optional(),
});

const nearbyResultItem = restaurantOutput.extend({
  distanceKm: z.number(),
});

// Output
const getNearbyOutput = z.object({
  items: z.array(nearbyResultItem),
  center: coordinatesSchema,
  radiusKm: z.number(),
});
```

---

#### `restaurant.create`

| Campo            | Valor                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Tipo**         | `mutation`                                                                           |
| **Autenticacao** | Owner / Admin                                                                        |
| **Rate limit**   | `write` (30/min)                                                                     |
| **Descricao**    | Cria um novo restaurante. O slug e gerado automaticamente a partir do nome e cidade. |

```typescript
const createRestaurantInput = z.object({
  name: z.string().min(2).max(255),
  description: multilingualText.optional(),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(20),
  district: z.string().max(100).optional(),
  country: z.string().length(2).default("PT"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  cuisineTypes: z.array(z.string()).optional(),
  priceRange: z.enum(["budget", "moderate", "upscale", "fine_dining"]).optional(),
  openingHours: z
    .record(
      z.string(),
      z.array(
        z.object({
          open: z.string().regex(/^\d{2}:\d{2}$/),
          close: z.string().regex(/^\d{2}:\d{2}$/),
        }),
      ),
    )
    .optional(),
  capacity: z.number().int().min(1).optional(),
});

// Output: restaurantOutput
```

---

#### `restaurant.update`

| Campo            | Valor                                           |
| ---------------- | ----------------------------------------------- |
| **Tipo**         | `mutation`                                      |
| **Autenticacao** | Owner (do restaurante) / Admin                  |
| **Rate limit**   | `write` (30/min)                                |
| **Descricao**    | Actualiza os dados de um restaurante existente. |

```typescript
const updateRestaurantInput = z.object({
  id: z.string().uuid(),
  ...createRestaurantInput.partial().shape,
});
```

**Erros:**

| Codigo      | Condicao                        |
| ----------- | ------------------------------- |
| `NOT_FOUND` | Restaurante nao encontrado      |
| `FORBIDDEN` | Utilizador nao e dono nem admin |

---

#### `restaurant.uploadPhoto`

| Campo            | Valor                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                                                              |
| **Autenticacao** | Autenticado                                                                                                             |
| **Rate limit**   | `upload` (5/min)                                                                                                        |
| **Descricao**    | Faz upload de fotografia de um restaurante. Ficheiro enviado via FormData separado; esta mutation regista os metadados. |

```typescript
const uploadPhotoInput = z.object({
  restaurantId: z.string().uuid(),
  caption: z.string().max(500).optional(),
  spaceType: z.enum(["entrance", "interior", "bathroom", "parking", "menu", "exterior", "food", "other"]),
  fileUrl: z.string().url(), // URL apos upload para storage
  fileSizeBytes: z.number().int().max(10_485_760), // max 10MB
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

const photoOutput = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  userId: z.string().uuid(),
  caption: z.string().nullable(),
  spaceType: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  createdAt: z.date(),
});
```

---

#### `restaurant.getPhotos`

| Campo            | Valor                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| **Tipo**         | `query`                                                                        |
| **Autenticacao** | Publica                                                                        |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)                                 |
| **Descricao**    | Devolve fotografias de um restaurante, com filtro opcional por tipo de espaco. |

```typescript
const getPhotosInput = z.object({
  restaurantId: z.string().uuid(),
  spaceType: z.enum(["entrance", "interior", "bathroom", "parking", "menu", "exterior", "food", "other"]).optional(),
  ...paginationInput.shape,
});

// Output: paginatedOutput(photoOutput)
```

---

#### `restaurant.getAccessibilityProfile`

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Tipo**         | `query`                                                        |
| **Autenticacao** | Publica                                                        |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)                 |
| **Descricao**    | Devolve o perfil de acessibilidade completo de um restaurante. |

```typescript
const getAccessibilityProfileInput = z.object({
  restaurantId: z.string().uuid(),
});

const restaurantAccessibilityOutput = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  verificationStatus: z.enum(["unverified", "community_verified", "professionally_verified"]),
  dataSource: z.enum(["owner", "community", "import", "ai_analysis"]),
  lastVerifiedAt: z.date().nullable(),

  // Entrada e exterior
  hasStepFreeEntrance: z.boolean().nullable(),
  stepCount: z.number().int().nullable(),
  stepHeight: z.number().nullable(),
  hasRamp: z.boolean().nullable(),
  rampIncline: z.number().nullable(),
  rampWidth: z.number().nullable(),
  entranceDoorWidth: z.number().nullable(),
  entranceType: z.enum(["automatic", "manual_push", "manual_pull", "revolving", "sliding", "open"]).nullable(),
  exteriorSurface: z.enum(["smooth", "cobblestone", "gravel", "uneven", "grass"]).nullable(),

  // Estacionamento
  hasAccessibleParking: z.boolean().nullable(),
  parkingSpotCount: z.number().int().nullable(),
  parkingDistanceMeters: z.number().nullable(),

  // Interior
  interiorDoorWidth: z.number().nullable(),
  corridorWidth: z.number().nullable(),
  floorType: z.enum(["smooth_tile", "carpet", "wood", "concrete", "uneven", "other"]).nullable(),
  hasElevator: z.boolean().nullable(),
  lighting: z.enum(["well_lit", "moderate", "poor"]).nullable(),

  // Mesas
  accessibleTableCount: z.number().int().nullable(),
  tableHeight: z.number().nullable(),
  tableClearanceUnder: z.number().nullable(),

  // Casa de banho
  hasAccessibleBathroom: z.boolean().nullable(),
  bathroomDoorWidth: z.number().nullable(),
  bathroomTurningRadius: z.number().nullable(),
  hasGrabBars: z.boolean().nullable(),
  grabBarSide: z.enum(["left", "right", "both"]).nullable(),

  // Pontuacao agregada
  overallScore: z.number().min(0).max(5).nullable(),
  entranceScore: z.number().min(0).max(5).nullable(),
  interiorScore: z.number().min(0).max(5).nullable(),
  bathroomScore: z.number().min(0).max(5).nullable(),

  updatedAt: z.date(),
});
```

**Exemplo de resposta:**

```json
{
  "id": "019505b1-...",
  "restaurantId": "019505a0-...",
  "verificationStatus": "community_verified",
  "dataSource": "community",
  "hasStepFreeEntrance": true,
  "hasRamp": false,
  "entranceDoorWidth": 92,
  "entranceType": "manual_push",
  "hasAccessibleParking": true,
  "parkingDistanceMeters": 15,
  "hasAccessibleBathroom": true,
  "bathroomDoorWidth": 88,
  "bathroomTurningRadius": 160,
  "hasGrabBars": true,
  "grabBarSide": "both",
  "overallScore": 4.2
}
```

---

#### `restaurant.updateAccessibilityProfile`

| Campo            | Valor                                                                |
| ---------------- | -------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                           |
| **Autenticacao** | Owner / Verifier / Admin                                             |
| **Rate limit**   | `write` (30/min)                                                     |
| **Descricao**    | Actualiza o perfil de acessibilidade. Regista alteracao no AuditLog. |

```typescript
const updateAccessibilityProfileInput = z.object({
  restaurantId: z.string().uuid(),
  // Todos os campos de restaurantAccessibilityOutput excepto id, restaurantId,
  // verificationStatus, dataSource, scores e timestamps
  ...restaurantAccessibilityOutput
    .omit({
      id: true,
      restaurantId: true,
      verificationStatus: true,
      dataSource: true,
      overallScore: true,
      entranceScore: true,
      interiorScore: true,
      bathroomScore: true,
      updatedAt: true,
      lastVerifiedAt: true,
    })
    .partial().shape,
});
```

---

#### `restaurant.claimOwnership`

| Campo            | Valor                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                       |
| **Autenticacao** | Autenticado                                                                      |
| **Rate limit**   | `write` (30/min)                                                                 |
| **Descricao**    | Submete um pedido de reivindicacao de propriedade. Requer verificacao por admin. |

```typescript
const claimOwnershipInput = z.object({
  restaurantId: z.string().uuid(),
  ownerName: z.string().min(2).max(255),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().max(30),
  proofDescription: z.string().min(10).max(2000),
  proofDocumentUrl: z.string().url().optional(),
});

const claimOwnershipOutput = z.object({
  claimId: z.string().uuid(),
  status: z.literal("pending"),
  message: z.string(), // "Pedido submetido. Sera analisado em 48-72 horas."
});
```

---

### 3.4 Review Router

#### `review.create`

| Campo            | Valor                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                                     |
| **Autenticacao** | Autenticado                                                                                    |
| **Rate limit**   | `write` (30/min)                                                                               |
| **Descricao**    | Cria uma avaliacao de um restaurante. Um utilizador so pode ter uma avaliacao por restaurante. |

```typescript
const createReviewInput = z.object({
  restaurantId: z.string().uuid(),
  foodRating: z.number().int().min(1).max(5),
  serviceRating: z.number().int().min(1).max(5),
  accessibilityRating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(5000),
  visitDate: z.date(),
  accessibilityComment: z.string().max(2000).optional(),
  // Tags de acessibilidade observadas durante a visita
  accessibilityTags: z.array(z.enum(["step_free_entrance", "ramp_available", "accessible_bathroom", "wide_doors", "accessible_parking", "lowered_counter", "braille_menu", "staff_assistance", "accessible_tables"])).optional(),
});

const reviewOutput = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  userMobilityType: z.string().nullable(),
  foodRating: z.number(),
  serviceRating: z.number(),
  accessibilityRating: z.number(),
  comment: z.string(),
  accessibilityComment: z.string().nullable(),
  accessibilityTags: z.array(z.string()),
  visitDate: z.date(),
  helpfulCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

**Erros:**

| Codigo      | Condicao                               |
| ----------- | -------------------------------------- |
| `CONFLICT`  | Utilizador ja avaliou este restaurante |
| `NOT_FOUND` | Restaurante nao encontrado             |

---

#### `review.update`

| Campo            | Valor                            |
| ---------------- | -------------------------------- |
| **Tipo**         | `mutation`                       |
| **Autenticacao** | Autenticado (autor)              |
| **Rate limit**   | `write` (30/min)                 |
| **Descricao**    | Actualiza uma avaliacao propria. |

```typescript
const updateReviewInput = z.object({
  id: z.string().uuid(),
  ...createReviewInput.omit({ restaurantId: true }).partial().shape,
});
```

**Erros:**

| Codigo      | Condicao                   |
| ----------- | -------------------------- |
| `FORBIDDEN` | Nao e o autor da avaliacao |

---

#### `review.delete`

| Campo            | Valor                          |
| ---------------- | ------------------------------ |
| **Tipo**         | `mutation`                     |
| **Autenticacao** | Autenticado (autor)            |
| **Rate limit**   | `write` (30/min)               |
| **Descricao**    | Elimina uma avaliacao propria. |

```typescript
const deleteReviewInput = z.object({
  id: z.string().uuid(),
});
const deleteReviewOutput = z.object({ success: z.literal(true) });
```

---

#### `review.getByRestaurant`

| Campo            | Valor                                          |
| ---------------- | ---------------------------------------------- |
| **Tipo**         | `query`                                        |
| **Autenticacao** | Publica                                        |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min) |
| **Descricao**    | Lista avaliacoes de um restaurante, paginadas. |

```typescript
const getByRestaurantInput = z.object({
  restaurantId: z.string().uuid(),
  ...paginationInput.shape,
  sortBy: z.enum(["createdAt", "accessibilityRating", "helpfulCount"]).default("createdAt"),
  sortOrder,
});

// Output: paginatedOutput(reviewOutput)
```

---

#### `review.getByUser`

| Campo            | Valor                                          |
| ---------------- | ---------------------------------------------- |
| **Tipo**         | `query`                                        |
| **Autenticacao** | Autenticado                                    |
| **Rate limit**   | `authenticated` (120/min)                      |
| **Descricao**    | Lista as avaliacoes do utilizador autenticado. |

```typescript
const getByUserInput = z.object({
  ...paginationInput.shape,
});
// Output: paginatedOutput(reviewOutput com campo restaurantName)
```

---

#### `review.markHelpful`

| Campo            | Valor                                                   |
| ---------------- | ------------------------------------------------------- |
| **Tipo**         | `mutation`                                              |
| **Autenticacao** | Autenticado                                             |
| **Rate limit**   | `write` (30/min)                                        |
| **Descricao**    | Marca uma avaliacao como util. Toggle (marca/desmarca). |

```typescript
const markHelpfulInput = z.object({
  reviewId: z.string().uuid(),
});
const markHelpfulOutput = z.object({
  helpful: z.boolean(), // true = marcado, false = desmarcado
  helpfulCount: z.number().int(),
});
```

---

#### `review.report`

| Campo            | Valor                                           |
| ---------------- | ----------------------------------------------- |
| **Tipo**         | `mutation`                                      |
| **Autenticacao** | Autenticado                                     |
| **Rate limit**   | `write` (30/min)                                |
| **Descricao**    | Denuncia uma avaliacao por conteudo inadequado. |

```typescript
const reportReviewInput = z.object({
  reviewId: z.string().uuid(),
  reason: z.enum(["spam", "offensive", "misleading", "not_about_restaurant", "other"]),
  details: z.string().max(1000).optional(),
});
const reportReviewOutput = z.object({
  reportId: z.string().uuid(),
  status: z.literal("pending"),
});
```

---

### 3.5 Menu Router

#### `menu.getByRestaurant`

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Tipo**         | `query`                                                        |
| **Autenticacao** | Publica                                                        |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)                 |
| **Descricao**    | Devolve a ementa activa de um restaurante com todos os pratos. |

```typescript
const getMenuInput = z.object({
  restaurantId: z.string().uuid(),
  locale: z.enum(["pt", "en", "es", "fr"]).default("pt"),
});

const dishOutput = z.object({
  id: z.string().uuid(),
  name: multilingualText,
  description: multilingualText.nullable(),
  price: z.number().positive(),
  currency: z.string().length(3).default("EUR"),
  category: z.string(),
  allergens: z.array(z.enum(["gluten", "crustaceans", "eggs", "fish", "peanuts", "soy", "milk", "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs"])),
  dietaryFlags: z.array(z.enum(["vegetarian", "vegan", "gluten_free", "lactose_free", "halal", "kosher", "organic"])),
  isAvailable: z.boolean(),
  photoUrl: z.string().url().nullable(),
});

const menuOutput = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: multilingualText,
  isActive: z.boolean(),
  dishes: z.array(dishOutput),
  updatedAt: z.date(),
});
```

---

#### `menu.create`

| Campo            | Valor                                     |
| ---------------- | ----------------------------------------- |
| **Tipo**         | `mutation`                                |
| **Autenticacao** | Owner / Admin                             |
| **Rate limit**   | `write` (30/min)                          |
| **Descricao**    | Cria uma nova ementa para um restaurante. |

```typescript
const createMenuInput = z.object({
  restaurantId: z.string().uuid(),
  name: multilingualText,
  isActive: z.boolean().default(true),
});
// Output: menuOutput (sem pratos inicialmente)
```

---

#### `menu.update`

| Campo            | Valor                              |
| ---------------- | ---------------------------------- |
| **Tipo**         | `mutation`                         |
| **Autenticacao** | Owner / Admin                      |
| **Rate limit**   | `write` (30/min)                   |
| **Descricao**    | Actualiza metadados de uma ementa. |

```typescript
const updateMenuInput = z.object({
  id: z.string().uuid(),
  name: multilingualText.optional(),
  isActive: z.boolean().optional(),
});
```

---

#### `menu.addDish`

| Campo            | Valor                           |
| ---------------- | ------------------------------- |
| **Tipo**         | `mutation`                      |
| **Autenticacao** | Owner / Admin                   |
| **Rate limit**   | `write` (30/min)                |
| **Descricao**    | Adiciona um prato a uma ementa. |

```typescript
const addDishInput = z.object({
  menuId: z.string().uuid(),
  name: multilingualText,
  description: multilingualText.optional(),
  price: z.number().positive().multipleOf(0.01),
  currency: z.string().length(3).default("EUR"),
  category: z.string().min(1).max(100),
  allergens: z.array(z.enum(["gluten", "crustaceans", "eggs", "fish", "peanuts", "soy", "milk", "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs"])).default([]),
  dietaryFlags: z.array(z.enum(["vegetarian", "vegan", "gluten_free", "lactose_free", "halal", "kosher", "organic"])).default([]),
  photoUrl: z.string().url().optional(),
});
// Output: dishOutput
```

---

#### `menu.updateDish`

| Campo            | Valor                         |
| ---------------- | ----------------------------- |
| **Tipo**         | `mutation`                    |
| **Autenticacao** | Owner / Admin                 |
| **Rate limit**   | `write` (30/min)              |
| **Descricao**    | Actualiza um prato existente. |

```typescript
const updateDishInput = z.object({
  id: z.string().uuid(),
  ...addDishInput.omit({ menuId: true }).partial().shape,
});
```

---

#### `menu.removeDish`

| Campo            | Valor                          |
| ---------------- | ------------------------------ |
| **Tipo**         | `mutation`                     |
| **Autenticacao** | Owner / Admin                  |
| **Rate limit**   | `write` (30/min)               |
| **Descricao**    | Remove um prato de uma ementa. |

```typescript
const removeDishInput = z.object({
  id: z.string().uuid(),
});
const removeDishOutput = z.object({ success: z.literal(true) });
```

---

### 3.6 Reservation Router

#### `reservation.create`

| Campo            | Valor                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                                         |
| **Autenticacao** | Autenticado                                                                                        |
| **Rate limit**   | `write` (30/min)                                                                                   |
| **Descricao**    | Cria uma reserva num restaurante. Inclui necessidades de acessibilidade automaticamente do perfil. |

```typescript
const createReservationInput = z.object({
  restaurantId: z.string().uuid(),
  dateTime: z.date().refine((d) => d > new Date(), {
    message: "A data da reserva deve ser no futuro.",
  }),
  partySize: z.number().int().min(1).max(20),
  specialRequests: z.string().max(1000).optional(),
  accessibilityNeeds: z
    .object({
      needsAccessibleTable: z.boolean().default(false),
      needsWheelchairSpace: z.boolean().default(false),
      specificNeeds: z.string().max(500).optional(),
    })
    .optional(),
});

const reservationOutput = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  restaurantName: z.string(),
  userId: z.string().uuid(),
  dateTime: z.date(),
  partySize: z.number().int(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]),
  specialRequests: z.string().nullable(),
  accessibilityNeeds: z
    .object({
      needsAccessibleTable: z.boolean(),
      needsWheelchairSpace: z.boolean(),
      specificNeeds: z.string().nullable(),
    })
    .nullable(),
  confirmationCode: z.string(),
  createdAt: z.date(),
});
```

**Exemplo de pedido:**

```typescript
await trpc.reservation.create.mutate({
  restaurantId: "019505a0-...",
  dateTime: new Date("2026-03-20T20:00:00"),
  partySize: 4,
  specialRequests: "Mesa junto a janela se possivel.",
  accessibilityNeeds: {
    needsAccessibleTable: true,
    needsWheelchairSpace: true,
    specificNeeds: "Cadeira de rodas electrica, largura 68cm. Preciso de espaco para manobrar.",
  },
});
```

---

#### `reservation.cancel`

| Campo            | Valor                                       |
| ---------------- | ------------------------------------------- |
| **Tipo**         | `mutation`                                  |
| **Autenticacao** | Autenticado (dono da reserva)               |
| **Rate limit**   | `write` (30/min)                            |
| **Descricao**    | Cancela uma reserva pendente ou confirmada. |

```typescript
const cancelReservationInput = z.object({
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});
const cancelReservationOutput = z.object({
  id: z.string().uuid(),
  status: z.literal("cancelled"),
});
```

---

#### `reservation.getByUser`

| Campo            | Valor                                     |
| ---------------- | ----------------------------------------- |
| **Tipo**         | `query`                                   |
| **Autenticacao** | Autenticado                               |
| **Rate limit**   | `authenticated` (120/min)                 |
| **Descricao**    | Lista reservas do utilizador autenticado. |

```typescript
const getByUserInput = z.object({
  ...paginationInput.shape,
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  upcoming: z.boolean().default(true), // true = apenas futuras
});
// Output: paginatedOutput(reservationOutput)
```

---

#### `reservation.getByRestaurant`

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Tipo**         | `query`                                                        |
| **Autenticacao** | Owner (do restaurante) / Admin                                 |
| **Rate limit**   | `authenticated` (120/min)                                      |
| **Descricao**    | Lista reservas de um restaurante (visivel apenas para o dono). |

```typescript
const getByRestaurantInput = z.object({
  restaurantId: z.string().uuid(),
  ...paginationInput.shape,
  date: z.date().optional(), // filtrar por dia especifico
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
});
// Output: paginatedOutput(reservationOutput com userId e userName)
```

---

#### `reservation.updateStatus`

| Campo            | Valor                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                  |
| **Autenticacao** | Owner / Admin                                                               |
| **Rate limit**   | `write` (30/min)                                                            |
| **Descricao**    | Altera o estado de uma reserva (confirmar, marcar como concluida, no-show). |

```typescript
const updateStatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["confirmed", "completed", "no_show"]),
  message: z.string().max(500).optional(), // Mensagem para o utilizador
});
const updateStatusOutput = reservationOutput;
```

---

### 3.7 AI Router

Todos os procedimentos do router de IA utilizam a API Claude (Sonnet 4.6 para a maioria, Opus 4.5 para tarefas que requerem raciocinio avancado) e estao sujeitos ao rate limit mais restritivo (10 pedidos/minuto) devido ao custo e latencia das chamadas de IA.

#### `ai.search`

| Campo            | Valor                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**         | `query`                                                                                                                                                     |
| **Autenticacao** | Publica (resultados limitados) / Autenticado (personalizados)                                                                                               |
| **Rate limit**   | `ai` (10/min)                                                                                                                                               |
| **Descricao**    | Pesquisa em linguagem natural com pipeline RAG: Claude interpreta a query, gera embedding, busca hibrida (vectorial + full-text), re-ranking personalizado. |

```typescript
const aiSearchInput = z.object({
  query: z.string().min(3).max(500),
  location: coordinatesSchema.optional(), // Para ponderar resultados por proximidade
  limit: z.number().int().min(1).max(20).default(10),
});

const aiSearchResultItem = z.object({
  restaurant: restaurantOutput,
  matchScore: z.number().min(0).max(1),
  explanation: z.string(), // Explicacao em linguagem natural
  accessibilityMatch: z.object({
    score: z.number().min(0).max(1),
    details: z.string(),
  }),
});

const aiSearchOutput = z.object({
  results: z.array(aiSearchResultItem),
  interpretedQuery: z.object({
    intent: z.enum(["search_restaurant", "get_info", "compare", "ask_accessibility"]),
    entities: z.record(z.string(), z.unknown()),
    semanticQuery: z.string(),
  }),
  processingTime: z.number(), // milissegundos
});
```

**Exemplo de pedido:**

```typescript
const results = await trpc.ai.search.query({
  query: "restaurante italiano acessivel no centro do Porto com estacionamento",
  location: { latitude: 41.1496, longitude: -8.6109 },
});
```

**Exemplo de resposta:**

```json
{
  "results": [
    {
      "restaurant": { "id": "...", "name": "Trattoria da Maria", "...": "..." },
      "matchScore": 0.94,
      "explanation": "Cozinha italiana autentica com entrada ao nivel da rua, porta de 90cm e estacionamento proprio com lugar reservado a 15m.",
      "accessibilityMatch": {
        "score": 0.96,
        "details": "Compativel com cadeira de rodas electrica de 68cm. Sem degraus na entrada, casa de banho adaptada com espaco de rotacao de 160cm."
      }
    }
  ],
  "interpretedQuery": {
    "intent": "search_restaurant",
    "entities": {
      "cuisine": "italiana",
      "location": "centro do Porto",
      "accessibility_required": true,
      "has_parking": true
    },
    "semanticQuery": "restaurante cozinha italiana centro historico Porto acessivel cadeira rodas estacionamento"
  },
  "processingTime": 3200
}
```

**Erros:**

| Codigo                  | Condicao                                        |
| ----------------------- | ----------------------------------------------- |
| `BAD_REQUEST`           | Query demasiado vaga para interpretar           |
| `INTERNAL_SERVER_ERROR` | Falha na API Claude ou no servico de embeddings |

---

#### `ai.analyzePhoto`

| Campo            | Valor                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Tipo**         | `mutation`                                                                           |
| **Autenticacao** | Autenticado                                                                          |
| **Rate limit**   | `ai` (10/min)                                                                        |
| **Descricao**    | Analisa fotografias de um restaurante com Claude Vision para avaliar acessibilidade. |

```typescript
const analyzePhotoInput = z.object({
  photoUrls: z.array(z.string().url()).min(1).max(10),
  restaurantId: z.string().uuid().optional(),
  analysisType: z.enum(["accessibility", "menu_extraction", "general"]).default("accessibility"),
});

const photoAnalysisOutput = z.object({
  analyses: z.array(
    z.object({
      photoUrl: z.string().url(),
      spaceType: z.enum(["entrance", "interior", "bathroom", "parking", "menu", "exterior", "other"]),
      overallAssessment: z.enum(["accessible", "partially_accessible", "not_accessible", "unknown"]),
      overallConfidence: z.number().min(0).max(1),
      findings: z.array(
        z.object({
          feature: z.string(),
          observation: z.string(),
          estimatedMeasurement: z
            .object({
              valueCm: z.number(),
              marginErrorCm: z.number(),
            })
            .nullable(),
          assessment: z.enum(["accessible", "partially_accessible", "not_accessible", "unknown"]),
          confidence: z.number().min(0).max(1),
        }),
      ),
    }),
  ),
  suggestedProfileUpdates: z.record(z.string(), z.unknown()).nullable(),
});
```

---

#### `ai.getRecommendations`

| Campo            | Valor                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Tipo**         | `query`                                                                                                         |
| **Autenticacao** | Autenticado                                                                                                     |
| **Rate limit**   | `ai` (10/min)                                                                                                   |
| **Descricao**    | Gera recomendacoes personalizadas com base no perfil de acessibilidade, historico de avaliacoes e preferencias. |

```typescript
const getRecommendationsInput = z.object({
  location: coordinatesSchema.optional(),
  mealType: z.enum(["almoco", "jantar", "brunch", "cafe"]).optional(),
  groupSize: z.number().int().min(1).max(20).optional(),
  limit: z.number().int().min(1).max(10).default(5),
});

const recommendationItem = z.object({
  restaurant: restaurantOutput,
  matchScore: z.number().min(0).max(1),
  reasons: z.array(z.string()), // Lista de razoes da recomendacao
  accessibilityHighlights: z.array(z.string()),
  potentialConcerns: z.array(z.string()), // Pontos de atencao
});

const getRecommendationsOutput = z.object({
  recommendations: z.array(recommendationItem),
  basedOn: z.object({
    mobilityType: z.string(),
    dietaryRestrictions: z.array(z.string()),
    previouslyVisited: z.number().int(),
  }),
});
```

---

#### `ai.summarizeReviews`

| Campo            | Valor                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Tipo**         | `query`                                                                                  |
| **Autenticacao** | Publica                                                                                  |
| **Rate limit**   | `ai` (10/min)                                                                            |
| **Descricao**    | Gera um resumo inteligente das avaliacoes de um restaurante, com foco em acessibilidade. |

```typescript
const summarizeReviewsInput = z.object({
  restaurantId: z.string().uuid(),
  locale: z.enum(["pt", "en", "es", "fr"]).default("pt"),
});

const summarizeReviewsOutput = z.object({
  summary: z.string(), // Resumo em linguagem natural
  accessibilitySummary: z.string(), // Resumo especifico de acessibilidade
  highlights: z.array(z.string()), // Pontos positivos
  concerns: z.array(z.string()), // Pontos negativos
  reviewCount: z.number().int(),
  averageRatings: z.object({
    food: z.number(),
    service: z.number(),
    accessibility: z.number(),
  }),
  lastUpdated: z.date(), // Quando o resumo foi gerado/cache
});
```

---

#### `ai.generateAccessibilityReport`

| Campo            | Valor                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**         | `query`                                                                                                                            |
| **Autenticacao** | Autenticado                                                                                                                        |
| **Rate limit**   | `ai` (10/min)                                                                                                                      |
| **Descricao**    | Gera relatorio de acessibilidade detalhado para um restaurante, cruzando dados estruturados, avaliacoes e analises de fotografias. |

```typescript
const generateReportInput = z.object({
  restaurantId: z.string().uuid(),
  includePhotos: z.boolean().default(true),
  includeReviews: z.boolean().default(true),
  targetProfile: z.enum(["electric_wheelchair", "manual_wheelchair", "walker", "crutches", "visual_impairment", "general"]).default("general"),
  locale: z.enum(["pt", "en", "es", "fr"]).default("pt"),
});

const accessibilityReportOutput = z.object({
  restaurantId: z.string().uuid(),
  restaurantName: z.string(),
  generatedAt: z.date(),
  overallAssessment: z.enum(["accessible", "partially_accessible", "not_accessible"]),
  overallScore: z.number().min(0).max(5),
  sections: z.array(
    z.object({
      area: z.enum(["entrance", "parking", "interior", "tables", "bathroom", "menu"]),
      score: z.number().min(0).max(5),
      assessment: z.string(),
      details: z.array(z.string()),
      suggestions: z.array(z.string()), // Sugestoes de melhoria para o dono
    }),
  ),
  compatibilityNote: z.string(), // Nota especifica para o perfil alvo
  dataSources: z.array(z.enum(["profile", "reviews", "photos", "verification"])),
  confidence: z.number().min(0).max(1),
});
```

---

#### `ai.translateContent`

| Campo            | Valor                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                          |
| **Autenticacao** | Owner / Admin                                                                       |
| **Rate limit**   | `ai` (10/min)                                                                       |
| **Descricao**    | Traduz conteudo de restaurante (descricao, ementas) para outros idiomas via Claude. |

```typescript
const translateContentInput = z.object({
  content: z.string().min(1).max(10000),
  sourceLocale: z.enum(["pt", "en", "es", "fr"]),
  targetLocales: z.array(z.enum(["pt", "en", "es", "fr"])).min(1),
  context: z.enum(["restaurant_description", "menu_item", "review", "accessibility"]),
});

const translateContentOutput = z.object({
  translations: z.record(z.enum(["pt", "en", "es", "fr"]), z.string()),
  sourceLocale: z.string(),
});
```

---

#### `ai.chat`

| Campo            | Valor                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tipo**         | `subscription` (SSE)                                                                                                                             |
| **Autenticacao** | Autenticado                                                                                                                                      |
| **Rate limit**   | `ai` (10/min)                                                                                                                                    |
| **Descricao**    | Assistente conversacional com streaming. Mantendo contexto da conversa, responde a perguntas sobre restaurantes, acessibilidade e recomendacoes. |

```typescript
const chatInput = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(), // Para manter contexto
  location: coordinatesSchema.optional(),
});

// Resposta via SSE (Server-Sent Events)
// Cada chunk:
const chatChunk = z.object({
  type: z.enum(["text_delta", "tool_use", "done"]),
  content: z.string().optional(), // Para text_delta
  toolName: z.string().optional(), // Para tool_use
  conversationId: z.string().uuid(),
});

// Resposta final (apos stream completo):
const chatOutput = z.object({
  conversationId: z.string().uuid(),
  response: z.string(),
  referencedRestaurants: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    }),
  ),
  suggestedActions: z.array(
    z.object({
      type: z.enum(["view_restaurant", "search", "make_reservation", "view_map"]),
      label: z.string(),
      params: z.record(z.string(), z.string()),
    }),
  ),
});
```

**Exemplo de interaccao:**

```typescript
// Cliente (React)
const subscription = trpc.ai.chat.subscribe({
  message: "Qual o melhor restaurante para ir com a minha cadeira de rodas electrica na zona da Ribeira?",
  location: { latitude: 41.1408, longitude: -8.6132 },
});

subscription.on("data", (chunk) => {
  if (chunk.type === "text_delta") {
    appendToUI(chunk.content);
  }
});
```

---

### 3.8 Verification Router

#### `verification.submitReport`

| Campo            | Valor                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tipo**         | `mutation`                                                                                                                                       |
| **Autenticacao** | Autenticado                                                                                                                                      |
| **Rate limit**   | `write` (30/min)                                                                                                                                 |
| **Descricao**    | Submete um relatorio de verificacao de acessibilidade. Qualquer utilizador autenticado pode submeter; verificadores certificados tem peso maior. |

```typescript
const submitReportInput = z.object({
  restaurantId: z.string().uuid(),
  visitDate: z.date(),
  sections: z
    .array(
      z.object({
        area: z.enum(["entrance", "parking", "interior", "tables", "bathroom", "menu", "other"]),
        findings: z.array(
          z.object({
            feature: z.string(),
            value: z.union([z.string(), z.number(), z.boolean()]),
            notes: z.string().max(500).optional(),
            confidence: z.number().min(0).max(1),
          }),
        ),
      }),
    )
    .min(1),
  overallNotes: z.string().max(2000).optional(),
  photoIds: z.array(z.string().uuid()).optional(), // Fotos ja submetidas
});

const verificationReportOutput = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
  visitDate: z.date(),
  sections: z.array(
    z.object({
      area: z.string(),
      findings: z.array(
        z.object({
          feature: z.string(),
          value: z.union([z.string(), z.number(), z.boolean()]),
          notes: z.string().nullable(),
          confidence: z.number(),
        }),
      ),
    }),
  ),
  createdAt: z.date(),
});
```

---

#### `verification.getReportsByRestaurant`

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Tipo**         | `query`                                                        |
| **Autenticacao** | Publica                                                        |
| **Rate limit**   | `public` (30/min) ou `authenticated` (120/min)                 |
| **Descricao**    | Lista relatorios de verificacao aprovados para um restaurante. |

```typescript
const getReportsByRestaurantInput = z.object({
  restaurantId: z.string().uuid(),
  ...paginationInput.shape,
});
// Output: paginatedOutput(verificationReportOutput)
```

---

#### `verification.reviewReport`

| Campo            | Valor                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                                                                       |
| **Autenticacao** | Admin                                                                                                            |
| **Rate limit**   | `write` (30/min)                                                                                                 |
| **Descricao**    | Aprova ou rejeita um relatorio de verificacao. Se aprovado, actualiza o perfil de acessibilidade do restaurante. |

```typescript
const reviewReportInput = z.object({
  reportId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(1000).optional(),
  applyToProfile: z.boolean().default(true), // Se true, os dados aprovados actualizam o perfil
});

const reviewReportOutput = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  profileUpdated: z.boolean(),
});
```

---

#### `verification.requestVerification`

| Campo            | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| **Tipo**         | `mutation`                                                               |
| **Autenticacao** | Owner / Admin                                                            |
| **Rate limit**   | `write` (30/min)                                                         |
| **Descricao**    | Solicita verificacao profissional de acessibilidade para um restaurante. |

```typescript
const requestVerificationInput = z.object({
  restaurantId: z.string().uuid(),
  contactName: z.string().min(2).max(255),
  contactPhone: z.string().max(30),
  contactEmail: z.string().email(),
  preferredDates: z.array(z.date()).min(1).max(5),
  notes: z.string().max(1000).optional(),
});

const requestVerificationOutput = z.object({
  requestId: z.string().uuid(),
  status: z.literal("pending"),
  estimatedResponseDays: z.number().int(),
});
```

---

### 3.9 Admin Router

Todos os procedimentos do router de administracao requerem o papel `admin`.

#### `admin.getDashboard`

| Campo            | Valor                                                              |
| ---------------- | ------------------------------------------------------------------ |
| **Tipo**         | `query`                                                            |
| **Autenticacao** | Admin                                                              |
| **Rate limit**   | `admin` (300/min)                                                  |
| **Descricao**    | Devolve metricas gerais do sistema para o painel de administracao. |

```typescript
const dashboardOutput = z.object({
  users: z.object({
    total: z.number().int(),
    activeLastMonth: z.number().int(),
    newLastWeek: z.number().int(),
  }),
  restaurants: z.object({
    total: z.number().int(),
    active: z.number().int(),
    pending: z.number().int(),
    claimed: z.number().int(),
  }),
  reviews: z.object({
    total: z.number().int(),
    lastWeek: z.number().int(),
    pendingModeration: z.number().int(),
  }),
  verifications: z.object({
    total: z.number().int(),
    pendingReview: z.number().int(),
    professionallyVerified: z.number().int(),
  }),
  ai: z.object({
    searchesLastMonth: z.number().int(),
    photoAnalysesLastMonth: z.number().int(),
    estimatedCostLastMonth: z.number(), // EUR
  }),
});
```

---

#### `admin.getUsers`

| Campo            | Valor                                       |
| ---------------- | ------------------------------------------- |
| **Tipo**         | `query`                                     |
| **Autenticacao** | Admin                                       |
| **Rate limit**   | `admin` (300/min)                           |
| **Descricao**    | Lista utilizadores com filtros e paginacao. |

```typescript
const getUsersInput = z.object({
  ...paginationInput.shape,
  search: z.string().optional(), // Pesquisa por nome ou email
  role: z.enum(["user", "owner", "verifier", "admin"]).optional(),
  sortBy: z.enum(["createdAt", "name", "reviewCount"]).default("createdAt"),
  sortOrder,
});

const adminUserOutput = z.object({
  id: z.string().uuid(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  emailVerified: z.boolean(),
  reviewCount: z.number().int(),
  createdAt: z.date(),
  lastActiveAt: z.date().nullable(),
});

// Output: paginatedOutput(adminUserOutput)
```

---

#### `admin.getRestaurants`

| Campo            | Valor                                                       |
| ---------------- | ----------------------------------------------------------- |
| **Tipo**         | `query`                                                     |
| **Autenticacao** | Admin                                                       |
| **Rate limit**   | `admin` (300/min)                                           |
| **Descricao**    | Lista restaurantes com filtros adicionais de administracao. |

```typescript
const getRestaurantsInput = z.object({
  ...paginationInput.shape,
  search: z.string().optional(),
  status: z.enum(["pending", "active", "inactive", "archived"]).optional(),
  verificationStatus: z.enum(["unverified", "community_verified", "professionally_verified"]).optional(),
  hasPendingClaim: z.boolean().optional(),
  sortBy: z.enum(["createdAt", "name", "reviewCount", "accessibilityScore"]).default("createdAt"),
  sortOrder,
});
// Output: paginatedOutput(restaurantOutput com campos de admin)
```

---

#### `admin.moderateReview`

| Campo            | Valor                            |
| ---------------- | -------------------------------- |
| **Tipo**         | `mutation`                       |
| **Autenticacao** | Admin                            |
| **Rate limit**   | `admin` (300/min)                |
| **Descricao**    | Modera uma avaliacao denunciada. |

```typescript
const moderateReviewInput = z.object({
  reviewId: z.string().uuid(),
  action: z.enum(["approve", "remove", "edit"]),
  reason: z.string().max(1000).optional(),
  editedContent: z.string().max(5000).optional(), // Se action = "edit"
});

const moderateReviewOutput = z.object({
  reviewId: z.string().uuid(),
  action: z.string(),
  success: z.literal(true),
});
```

---

#### `admin.moderatePhoto`

| Campo            | Valor                                     |
| ---------------- | ----------------------------------------- |
| **Tipo**         | `mutation`                                |
| **Autenticacao** | Admin                                     |
| **Rate limit**   | `admin` (300/min)                         |
| **Descricao**    | Modera uma fotografia (aprovar, remover). |

```typescript
const moderatePhotoInput = z.object({
  photoId: z.string().uuid(),
  action: z.enum(["approve", "remove"]),
  reason: z.string().max(1000).optional(),
});

const moderatePhotoOutput = z.object({
  photoId: z.string().uuid(),
  action: z.string(),
  success: z.literal(true),
});
```

---

#### `admin.getSystemStats`

| Campo            | Valor                                                           |
| ---------------- | --------------------------------------------------------------- |
| **Tipo**         | `query`                                                         |
| **Autenticacao** | Admin                                                           |
| **Rate limit**   | `admin` (300/min)                                               |
| **Descricao**    | Devolve estatisticas tecnicas do sistema (DB, IA, performance). |

```typescript
const systemStatsOutput = z.object({
  database: z.object({
    sizeBytes: z.number(),
    connectionCount: z.number().int(),
    embeddingCount: z.number().int(),
    averageQueryTimeMs: z.number(),
  }),
  ai: z.object({
    claudeApiStatus: z.enum(["healthy", "degraded", "down"]),
    ollamaStatus: z.enum(["healthy", "degraded", "down"]),
    totalApiCalls: z.number().int(),
    totalTokensUsed: z.number().int(),
    estimatedCostEur: z.number(),
  }),
  cache: z.object({
    hitRate: z.number().min(0).max(1),
    memoryUsageBytes: z.number(),
  }),
  uptime: z.number(), // segundos
});
```

---

## 4. Eventos em Tempo Real (SSE)

A aplicacao utiliza Server-Sent Events (SSE) via Next.js Route Handlers para comunicacao unidireccional servidor-para-cliente. O tRPC suporta subscriptions que mapeiam para SSE.

### 4.1 Canais de Eventos

| Canal                     | Descricao                                        | Autenticacao        |
| ------------------------- | ------------------------------------------------ | ------------------- |
| `restaurant.availability` | Actualizacoes de disponibilidade de mesas        | Publica             |
| `review.new`              | Notificacao de nova avaliacao num restaurante    | Autenticado (donos) |
| `ai.stream`               | Streaming de respostas do Claude (chat, resumos) | Autenticado         |
| `verification.status`     | Actualizacoes de estado de verificacao           | Autenticado (donos) |
| `reservation.update`      | Actualizacoes de estado de reservas              | Autenticado         |

### 4.2 Formato dos Eventos SSE

```typescript
// Formato padrao de evento SSE
interface SSEEvent<T> {
  id: string; // UUID do evento
  type: string; // Nome do canal
  data: T; // Payload tipado
  timestamp: Date;
}

// Exemplo: evento de nova avaliacao
// event: review.new
// id: 019505c3-...
// data: {"restaurantId":"...","reviewId":"...","rating":4,"userName":"Joao"}
```

### 4.3 Implementacao no Next.js

```typescript
// src/app/api/events/[channel]/route.ts
export async function GET(request: Request, { params }: { params: { channel: string } }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: SSEEvent<unknown>) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\nid: ${event.id}\ndata: ${JSON.stringify(event.data)}\n\n`));
      };

      // Subscrever ao canal via pub/sub interno
      const unsubscribe = eventBus.subscribe(params.channel, send);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## 5. Integracoes com APIs Externas

### 5.1 Google Places API (free tier)

| Campo          | Valor                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Utilizacao** | Enriquecimento de dados basicos de restaurantes (nome, morada, telefone, horarios, fotos) |
| **Endpoint**   | `https://places.googleapis.com/v1/places:searchText`                                      |
| **Limite**     | Tier gratuito: ate 5.000 pedidos/mes para Place Details                                   |
| **Trigger**    | Quando um restaurante e criado, buscar dados complementares                               |

```typescript
interface GooglePlacesIntegration {
  searchByName(name: string, location: { lat: number; lng: number }): Promise<PlaceResult>;
  getDetails(placeId: string): Promise<PlaceDetails>;
  getPhotos(placeId: string, maxResults?: number): Promise<string[]>;
}
```

### 5.2 OpenStreetMap Nominatim

| Campo          | Valor                                                           |
| -------------- | --------------------------------------------------------------- |
| **Utilizacao** | Geocodificacao (morada -> coordenadas) e geocodificacao inversa |
| **Endpoint**   | `https://nominatim.openstreetmap.org/search`                    |
| **Limite**     | 1 pedido/segundo (requisito de fair use)                        |
| **Custo**      | Gratuito                                                        |

```typescript
interface NominatimIntegration {
  geocode(address: string): Promise<{ lat: number; lon: number }>;
  reverseGeocode(lat: number, lon: number): Promise<{ address: string; city: string }>;
}
```

### 5.3 Wheelmap API

| Campo          | Valor                                                               |
| -------------- | ------------------------------------------------------------------- |
| **Utilizacao** | Importacao de dados de acessibilidade existentes (formato A11yJSON) |
| **Endpoint**   | `https://wheelmap.org/api/nodes`                                    |
| **Limite**     | API key necessaria, limite nao publicado                            |
| **Trigger**    | Batch import semanal para novos restaurantes na area do Porto       |

```typescript
interface WheelmapIntegration {
  getNodesByBBox(bbox: { sw: Coordinates; ne: Coordinates }): Promise<WheelmapNode[]>;
  getNodeById(id: number): Promise<WheelmapNode>;
  mapToAccessibilityProfile(node: WheelmapNode): Partial<AccessibilityProfile>;
}
```

### 5.4 Claude API (Anthropic)

| Campo          | Valor                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Utilizacao** | Todas as funcionalidades de IA (pesquisa, analise de fotos, chat, traducao) |
| **SDK**        | `@anthropic-ai/sdk`                                                         |
| **Modelos**    | Sonnet 4.6 (producao), Opus 4.5 (raciocinio avancado)                       |
| **Limite**     | Rate limit da API Anthropic (varia por tier)                                |

```typescript
interface ClaudeIntegration {
  interpretQuery(query: string, tools: Tool[]): Promise<ToolUseResult>;
  analyzeImage(imageUrl: string, systemPrompt: string): Promise<VisionResult>;
  generateText(messages: Message[], options?: { stream: boolean }): Promise<string | AsyncIterable<string>>;
  createEmbedding(text: string): Promise<number[]>; // Fallback se Ollama indisponivel
}
```

**Custos estimados por operacao (Sonnet 4.6):**

| Operacao                 | Input tokens | Output tokens | Custo estimado |
| ------------------------ | ------------ | ------------- | -------------- |
| Interpretacao de query   | ~500         | ~200          | ~$0.002        |
| Re-ranking de resultados | ~3000        | ~500          | ~$0.012        |
| Analise de fotografia    | ~1500        | ~500          | ~$0.007        |
| Resumo de avaliacoes     | ~5000        | ~800          | ~$0.020        |
| Traducao de conteudo     | ~500         | ~500          | ~$0.003        |
| Chat (por mensagem)      | ~2000        | ~500          | ~$0.008        |

---

## 6. Webhook Endpoints

Os webhooks sao implementados como Next.js Route Handlers (nao tRPC) por serem chamados por sistemas externos.

### 6.1 Confirmacao de Reserva

```plaintext
POST /api/webhooks/reservation-confirmation
```

Recebe callback de sistemas externos de reserva (se integrados) para actualizar o estado.

```typescript
// src/app/api/webhooks/reservation-confirmation/route.ts
const webhookPayload = z.object({
  reservationId: z.string().uuid(),
  externalId: z.string(),
  status: z.enum(["confirmed", "rejected"]),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Verificacao: HMAC-SHA256 no header X-Webhook-Signature
```

### 6.2 Verificacao de Reivindicacao de Restaurante

```plaintext
POST /api/webhooks/claim-verification
```

Recebe resultado da verificacao de documentos submetidos para reivindicacao de propriedade.

```typescript
const claimWebhookPayload = z.object({
  claimId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  verified: z.boolean(),
  verifiedBy: z.string(),
  notes: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Verificacao: HMAC-SHA256 no header X-Webhook-Signature
```

### 6.3 Seguranca dos Webhooks

Todos os webhooks verificam a assinatura HMAC-SHA256:

```typescript
import { createHmac, timingSafeEqual } from "crypto";

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

---

## 7. Seguranca e RGPD

### 7.1 Endpoints RGPD

O Regulamento Geral de Proteccao de Dados (RGPD) exige que os utilizadores possam exercer os seus direitos. Estes endpoints estao incluidos no router `user`.

#### `user.exportData` (RGPD Art. 20 - Portabilidade)

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Tipo**         | `mutation`                                                     |
| **Autenticacao** | Autenticado                                                    |
| **Rate limit**   | 1 pedido por 24 horas                                          |
| **Descricao**    | Exporta todos os dados pessoais do utilizador em formato JSON. |

```typescript
const exportDataOutput = z.object({
  downloadUrl: z.string().url(), // URL temporario (expira em 24h)
  expiresAt: z.date(),
  format: z.literal("json"),
  includes: z.array(z.enum(["profile", "accessibility_profile", "reviews", "photos", "reservations", "preferences"])),
});
```

#### `user.requestDataDeletion` (RGPD Art. 17 - Direito ao Esquecimento)

Implementado via `user.deleteAccount` (seccao 3.2). O processo de eliminacao:

1. Anonimiza avaliacoes (substitui `userId` por `null`, `userName` por "Utilizador anonimo")
2. Remove fotografias enviadas pelo utilizador
3. Cancela reservas futuras pendentes
4. Remove perfil de acessibilidade
5. Remove dados de autenticacao (Better Auth)
6. Regista a eliminacao no AuditLog (sem dados pessoais, apenas timestamp e tipo)
7. Dados efectivamente eliminados em 30 dias (periodo de graca para recuperacao)

### 7.2 Sanitizacao de Input

O tRPC com Zod valida todos os inputs automaticamente. Adicionalmente:

```typescript
// Sanitizacao de strings para prevenir XSS
import DOMPurify from "isomorphic-dompurify";

const sanitizedString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform((val) => DOMPurify.sanitize(val));
```

### 7.3 Prevencao de SQL Injection

O Drizzle ORM utiliza prepared statements para todas as queries, prevenindo SQL injection por desenho:

```typescript
// Drizzle gera automaticamente prepared statements
const result = await db.select().from(restaurants).where(eq(restaurants.id, input.id)); // input.id e parametrizado
```

### 7.4 Proteccao CSRF

O tRPC sobre HTTP utiliza apenas pedidos POST para mutations. A proteccao adicional e assegurada por:

- Token CSRF gerido pelo Better Auth
- Header `Origin` verificado pelo middleware CORS
- Cookies com `SameSite=Lax` e `Secure` em producao

### 7.5 Headers de Seguranca

```typescript
// next.config.ts (extracto)
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];
```

### 7.6 Rate Limiting por Categoria de Endpoint

| Categoria             | Endpoints                                                    | Limite  | Identificador |
| --------------------- | ------------------------------------------------------------ | ------- | ------------- |
| Publica               | `restaurant.list`, `restaurant.getById`, `restaurant.search` | 30/min  | IP            |
| Autenticada (leitura) | `user.getProfile`, `review.getByUser`                        | 120/min | userId        |
| Autenticada (escrita) | `review.create`, `reservation.create`                        | 30/min  | userId        |
| IA                    | `ai.search`, `ai.chat`, `ai.analyzePhoto`                    | 10/min  | userId        |
| Upload                | `restaurant.uploadPhoto`                                     | 5/min   | userId        |
| Autenticacao          | `auth.login`, `auth.register`                                | 10/min  | IP            |
| Reset password        | `auth.requestPasswordReset`                                  | 3/min   | IP            |
| Admin                 | Todos os endpoints `admin.*`                                 | 300/min | userId        |
| Exportacao RGPD       | `user.exportData`                                            | 1/dia   | userId        |

### 7.7 Logging e Auditoria

Todas as operacoes que alteram dados de acessibilidade sao registadas na tabela `audit_logs`:

```typescript
const auditLogEntry = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.enum(["accessibility_profile_updated", "verification_report_submitted", "verification_report_approved", "restaurant_created", "restaurant_updated", "review_moderated", "photo_moderated", "account_deleted", "data_exported", "ownership_claimed"]),
  entityType: z.string(),
  entityId: z.string().uuid(),
  changes: z.record(
    z.string(),
    z.object({
      old: z.unknown(),
      new: z.unknown(),
    }),
  ),
  ip: z.string(),
  userAgent: z.string(),
  createdAt: z.date(),
});
```
