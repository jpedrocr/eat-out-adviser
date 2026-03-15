# Eat Out Adviser - Especificacao do Modelo de Dados

**Data:** Marco de 2026 **Projecto:** Eat Out Adviser - Modelo de dados para PostgreSQL 17 + pgvector + Drizzle ORM **Normas de referencia:** ADA (Americans with Disabilities Act), ISO 21542:2021, EAA (European Accessibility Act), EN 301 549

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Convencoes e Tipos Partilhados](#2-convencoes-e-tipos-partilhados)
3. [Entidades](#3-entidades)
   - 3.1 [Utilizador (User)](#31-utilizador-user)
   - 3.2 [Restaurante (Restaurant)](#32-restaurante-restaurant)
   - 3.3 [Perfil de Acessibilidade do Restaurante (AccessibilityProfile)](#33-perfil-de-acessibilidade-do-restaurante-accessibilityprofile)
   - 3.4 [Pontuacao de Acessibilidade (AccessibilityScore)](#34-pontuacao-de-acessibilidade-accessibilityscore)
   - 3.5 [Avaliacao (Review)](#35-avaliacao-review)
   - 3.6 [Fotografia (Photo)](#36-fotografia-photo)
   - 3.7 [Ementa (Menu)](#37-ementa-menu)
   - 3.8 [Prato (Dish)](#38-prato-dish)
   - 3.9 [Reserva (Reservation)](#39-reserva-reservation)
   - 3.10 [Relatorio de Verificacao (VerificationReport)](#310-relatorio-de-verificacao-verificationreport)
   - 3.11 [Traducao (Translation)](#311-traducao-translation)
   - 3.12 [Registo de Auditoria (AuditLog)](#312-registo-de-auditoria-auditlog)
4. [Diagrama de Relacoes entre Entidades](#4-diagrama-de-relacoes-entre-entidades)
5. [Indices e Estrategia de Performance](#5-indices-e-estrategia-de-performance)
6. [Estrategia de Migracoes](#6-estrategia-de-migracoes)
7. [Estrategia de Povoamento Inicial (Seeding)](#7-estrategia-de-povoamento-inicial-seeding)
8. [Compatibilidade com A11yJSON](#8-compatibilidade-com-a11yjson)

---

## 1. Visao Geral

O modelo de dados do Eat Out Adviser foi desenhado com os seguintes principios:

- **Acessibilidade como cidadao de primeira classe:** O perfil de acessibilidade do restaurante e a entidade mais detalhada e central do sistema, com campos derivados directamente das normas internacionais ADA, ISO 21542 e EAA.
- **Pesquisa semantica via pgvector:** As entidades Restaurante, Avaliacao e Prato incluem campos de embedding vectorial (`vector(1024)`) para pesquisa semantica com RAG.
- **Multilingue por desenho:** Campos textuais descritivos utilizam JSON multilingue ou a tabela de Traducao, permitindo expansao para novos idiomas sem alteracao de esquema.
- **Auditabilidade total:** Todas as alteracoes em dados de acessibilidade sao rastreadas via AuditLog.
- **Compatibilidade com A11yJSON:** O modelo mapeia para o formato aberto A11yJSON (Sozialhelden/accessibility.cloud), facilitando importacao e exportacao de dados.

**Tecnologias:**

- PostgreSQL 17 com extensao pgvector
- Drizzle ORM (esquemas TypeScript code-first)
- Better Auth (gestao de autenticacao e sessoes)

---

## 2. Convencoes e Tipos Partilhados

### 2.1 Convencoes de Nomenclatura

| Convencao           | Regra                                | Exemplo                                 |
| ------------------- | ------------------------------------ | --------------------------------------- |
| Tabelas             | `snake_case`, plural                 | `restaurants`, `accessibility_profiles` |
| Colunas             | `snake_case`                         | `created_at`, `wheelchair_width`        |
| Enums PostgreSQL    | `snake_case` com prefixo da entidade | `mobility_type`, `price_range`          |
| Chaves primarias    | `id` (UUID v7)                       | `id`                                    |
| Chaves estrangeiras | `{entidade}_id`                      | `restaurant_id`, `user_id`              |
| Timestamps          | `created_at`, `updated_at`           | ISO 8601 com timezone                   |
| Booleanos           | prefixo `is_` ou `has_`              | `has_ramp`, `is_active`                 |

### 2.2 Tipos Base Reutilizaveis

```typescript
// src/db/schema/shared.ts
import { pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";

// --- Enums Partilhados ---

export const mobilityTypeEnum = pgEnum("mobility_type", ["electric_wheelchair", "manual_wheelchair", "walker", "crutches", "cane", "scooter", "none", "other"]);

export const priceRangeEnum = pgEnum("price_range", ["budget", "moderate", "upscale", "fine_dining"]);

export const verificationStatusEnum = pgEnum("verification_status", ["unverified", "community_verified", "professionally_verified"]);

export const dataSourceEnum = pgEnum("data_source", ["owner", "community", "import", "ai_analysis"]);

// --- Campos comuns (timestamps) ---
// Utilizados via spread em todas as tabelas

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
```

### 2.3 Estrategia de Identificadores

Todas as chaves primarias utilizam UUID v7, que combina:

- Ordenacao temporal (os primeiros 48 bits sao um timestamp Unix em milissegundos)
- Unicidade global sem coordenacao centralizada
- Compatibilidade nativa com indices B-tree do PostgreSQL (ao contrario do UUID v4, que fragmenta indices)

```typescript
import { uuid } from "drizzle-orm/pg-core";

// Padrao para todas as PKs
const id = uuid("id").primaryKey().defaultRandom();
// Nota: Em producao, substituir defaultRandom() por uma funcao
// que gere UUID v7 (ex.: via extensao pg_uuidv7 ou aplicacao)
```

---

## 3. Entidades

### 3.1 Utilizador (User)

A tabela `users` armazena os dados de cada utilizador registado. A autenticacao e gerida pelo Better Auth, que cria as suas proprias tabelas (`session`, `account`, `verification`). A tabela `users` e partilhada entre o Better Auth e a logica de negocio da aplicacao.

O perfil de acessibilidade do utilizador e armazenado numa tabela separada (`user_accessibility_profiles`) com relacao 1:1, permitindo:

- Evolucao independente do esquema de acessibilidade
- Consultas mais eficientes quando so se precisa de dados basicos do utilizador
- Reutilizacao da estrutura do perfil para diferentes contextos

```typescript
// src/db/schema/users.ts
import { pgTable, uuid, varchar, text, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { mobilityTypeEnum, timestamps } from "./shared";

// --- Tabela: users ---

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  locale: varchar("locale", { length: 10 }).notNull().default("pt"),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),

  // Better Auth gere estes campos internamente:
  // - password hash (na tabela 'account')
  // - sessoes (na tabela 'session')
  // - providers OAuth (na tabela 'account')

  ...timestamps,
});

// --- Tabela: user_accessibility_profiles ---

export const userAccessibilityProfiles = pgTable("user_accessibility_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  // Tipo de mobilidade
  mobilityType: mobilityTypeEnum("mobility_type").notNull().default("electric_wheelchair"),

  // Dimensoes da cadeira de rodas / dispositivo de mobilidade (cm)
  wheelchairWidth: real("wheelchair_width"),
  wheelchairLength: real("wheelchair_length"),
  turningRadiusNeeded: real("turning_radius_needed"),

  // Capacidades fisicas
  maxRampIncline: real("max_ramp_incline"), // percentagem (ex.: 8.33 para ADA)
  maxStepHeight: real("max_step_height"), // cm - altura maxima de degrau que consegue ultrapassar
  needsElevator: boolean("needs_elevator").notNull().default(true),
  needsAccessibleBathroom: boolean("needs_accessible_bathroom").notNull().default(true),
  bathroomTransferSide: pgEnum("bathroom_transfer_side", ["left", "right", "both", "not_applicable"])("bathroom_transfer_side").default("not_applicable"),
  doorOpeningForceLimit: real("door_opening_force_limit"), // kg

  // Contexto social
  companionCount: integer("companion_count").default(1),

  // Preferencias alimentares
  dietaryRestrictions: text("dietary_restrictions").array(),
  allergies: text("allergies").array(),
  preferredCuisines: text("preferred_cuisines").array(),

  // Logistica
  maxDistanceFromParking: integer("max_distance_from_parking"), // metros

  // Campo aberto para necessidades nao cobertas
  otherNeeds: text("other_needs"),

  ...timestamps,
});
```

**Notas sobre o perfil de acessibilidade do utilizador:**

| Campo                      | Unidade | Referencia normativa | Notas                                                              |
| -------------------------- | ------- | -------------------- | ------------------------------------------------------------------ |
| `wheelchair_width`         | cm      | ISO 21542            | Cadeira electrica tipica: 60-75 cm                                 |
| `wheelchair_length`        | cm      | ISO 21542            | Cadeira electrica tipica: 100-130 cm                               |
| `turning_radius_needed`    | cm      | ADA 304.3            | ADA exige minimo 152 cm (60 pol.)                                  |
| `max_ramp_incline`         | %       | ADA 405.2            | ADA: max 8.33% (1:12). Portugal (DL 163/2006): max 6% (ideal) a 8% |
| `max_step_height`          | cm      | ISO 21542            | 0 = nao consegue ultrapassar qualquer degrau                       |
| `door_opening_force_limit` | kg      | ADA 404.2.9          | ADA: max 2.27 kg (5 lbs) para portas interiores                    |
| `bathroom_transfer_side`   | enum    | ADA 604.2            | Lado necessario para transferencia da cadeira para a sanita        |

**Relacoes:**

```typescript
export const usersRelations = relations(users, ({ one, many }) => ({
  accessibilityProfile: one(userAccessibilityProfiles, {
    fields: [users.id],
    references: [userAccessibilityProfiles.userId],
  }),
  reviews: many(reviews),
  photos: many(photos),
  reservations: many(reservations),
  ownedRestaurants: many(restaurants),
}));

export const userAccessibilityProfilesRelations = relations(userAccessibilityProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userAccessibilityProfiles.userId],
    references: [users.id],
  }),
}));
```

---

### 3.2 Restaurante (Restaurant)

A tabela `restaurants` e a entidade central de negocio. Cada restaurante possui relacoes com o perfil de acessibilidade, avaliacoes, fotografias, ementas e reservas.

As coordenadas geograficas sao armazenadas como campos `real` simples (latitude/longitude), evitando a dependencia da extensao PostGIS. Para consultas de proximidade, utiliza-se a formula de Haversine em SQL ou indice GiST com `cube` e `earthdistance`.

```typescript
// src/db/schema/restaurants.ts
import { pgTable, uuid, varchar, text, real, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { vector } from "pgvector/drizzle-orm";
import { priceRangeEnum, timestamps } from "./shared";

export const restaurantStatusEnum = pgEnum("restaurant_status", ["pending", "active", "inactive", "archived"]);

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),

    // Descricao multilingue: { "pt": "...", "en": "...", "es": "..." }
    description: jsonb("description"),

    // Morada
    address: varchar("address", { length: 500 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    district: varchar("district", { length: 100 }),
    country: varchar("country", { length: 2 }).notNull().default("PT"),

    // Coordenadas geograficas
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),

    // Contacto
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 500 }),

    // Caracteristicas
    cuisineTypes: text("cuisine_types").array(),
    priceRange: priceRangeEnum("price_range"),

    // Horario de funcionamento (estruturado por dia da semana)
    // Formato: { "mon": [{"open":"12:00","close":"15:00"},{"open":"19:00","close":"23:00"}], ... }
    openingHours: jsonb("opening_hours"),

    capacity: integer("capacity"),

    // Gestao
    isClaimedByOwner: boolean("is_claimed_by_owner").notNull().default(false),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: restaurantStatusEnum("status").notNull().default("pending"),

    // Medias de avaliacao (caches desnormalizados, actualizados por trigger ou job)
    averageFoodRating: real("average_food_rating"),
    averageServiceRating: real("average_service_rating"),
    averageAccessibilityScore: real("average_accessibility_score"),

    // Embedding vectorial para pesquisa semantica (RAG com pgvector)
    // Dimensao 1024 compativel com nomic-embed-text-v2
    embedding: vector("embedding", { dimensions: 1024 }),

    ...timestamps,
  },
  (table) => [index("restaurants_slug_idx").on(table.slug), index("restaurants_city_idx").on(table.city), index("restaurants_status_idx").on(table.status), index("restaurants_owner_idx").on(table.ownerId), index("restaurants_coords_idx").on(table.latitude, table.longitude)],
);
```

**Formato do campo `opening_hours`:**

```jsonc
{
  "mon": [
    { "open": "12:00", "close": "15:00" },
    { "open": "19:00", "close": "23:00" },
  ],
  "tue": [{ "open": "12:00", "close": "23:00" }],
  "wed": [{ "open": "12:00", "close": "23:00" }],
  "thu": [{ "open": "12:00", "close": "23:00" }],
  "fri": [{ "open": "12:00", "close": "00:00" }],
  "sat": [{ "open": "12:00", "close": "00:00" }],
  "sun": [], // encerrado
}
```

**Relacoes:**

```typescript
export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  accessibilityProfile: one(accessibilityProfiles),
  accessibilityScore: one(accessibilityScores),
  reviews: many(reviews),
  photos: many(photos),
  menus: many(menus),
  reservations: many(reservations),
  verificationReports: many(verificationReports),
}));
```

---

### 3.3 Perfil de Acessibilidade do Restaurante (AccessibilityProfile)

Esta e a **entidade nuclear** do Eat Out Adviser. Modela de forma granular todas as caracteristicas de acessibilidade fisica de um restaurante, alinhadas com as normas internacionais ADA, ISO 21542:2021 e EAA.

Cada restaurante tem exactamente um perfil de acessibilidade (relacao 1:1). Os campos estao organizados por zona do espaco: entrada/exterior, estacionamento, interior/circulacao, mesas/assentos, casa de banho e comunicacao/ementa.

```typescript
// src/db/schema/accessibility-profiles.ts
import { pgTable, uuid, varchar, text, real, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { verificationStatusEnum, dataSourceEnum, timestamps } from "./shared";

// --- Enums especificos de acessibilidade ---

export const entranceTypeEnum = pgEnum("entrance_type", ["automatic", "manual_push", "manual_pull", "revolving", "sliding", "open"]);

export const surfaceTypeEnum = pgEnum("surface_type", ["smooth", "cobblestone", "gravel", "uneven", "grass"]);

export const parkingSurfaceTypeEnum = pgEnum("parking_surface_type", ["asphalt", "concrete", "cobblestone", "gravel", "other"]);

export const lightingEnum = pgEnum("lighting_level", ["well_lit", "moderate", "poor"]);

export const floorTypeEnum = pgEnum("floor_type", ["smooth_tile", "carpet", "wood", "concrete", "uneven", "other"]);

export const grabBarSideEnum = pgEnum("grab_bar_side", ["left", "right", "both"]);

export const faucetTypeEnum = pgEnum("faucet_type", ["lever", "sensor", "knob"]);

// --- Tabela: accessibility_profiles ---

export const accessibilityProfiles = pgTable("accessibility_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // ============================================
  // ENTRADA E EXTERIOR
  // ============================================

  // Entrada principal
  hasAccessibleEntrance: boolean("has_accessible_entrance"),
  entranceDoorWidth: real("entrance_door_width"), // cm
  entranceType: entranceTypeEnum("entrance_type"),
  hasLevelEntrance: boolean("has_level_entrance"), // sem qualquer degrau

  // Rampa
  hasRamp: boolean("has_ramp"),
  rampIncline: real("ramp_incline"), // percentagem (ex.: 8.33)
  rampHasHandrails: boolean("ramp_has_handrails"),

  // Degraus
  numberOfSteps: integer("number_of_steps"),
  stepHeight: real("step_height"), // cm - altura media dos degraus

  // Rampa portatil
  hasPortableRamp: boolean("has_portable_ramp"),

  // Campainha / intercomunicador
  hasDoorbell: boolean("has_doorbell"),
  doorbellHeight: real("doorbell_height"), // cm desde o chao
  doorbellIsAccessible: boolean("doorbell_is_accessible"), // alcancavel de cadeira de rodas

  // Superficie exterior
  exteriorSurfaceType: surfaceTypeEnum("exterior_surface_type"),

  // Iluminacao da entrada
  entranceLighting: lightingEnum("entrance_lighting"),

  // Notas sobre a entrada (campo livre para detalhes adicionais)
  entranceNotes: text("entrance_notes"),

  // ============================================
  // ESTACIONAMENTO
  // ============================================

  hasAccessibleParking: boolean("has_accessible_parking"),
  accessibleParkingSpaces: integer("accessible_parking_spaces"),
  parkingDistanceToEntrance: integer("parking_distance_to_entrance"), // metros
  parkingSpaceWidth: real("parking_space_width"), // cm
  hasAdjacentAccessAisle: boolean("has_adjacent_access_aisle"),
  accessAisleWidth: real("access_aisle_width"), // cm
  parkingSurfaceType: parkingSurfaceTypeEnum("parking_surface_type"),
  hasDropoffArea: boolean("has_dropoff_area"),
  parkingNotes: text("parking_notes"),

  // ============================================
  // INTERIOR E CIRCULACAO
  // ============================================

  corridorMinWidth: real("corridor_min_width"), // cm

  // Elevador (se o restaurante tem pisos multiplos)
  hasElevator: boolean("has_elevator"),
  elevatorDoorWidth: real("elevator_door_width"), // cm
  elevatorCabinWidth: real("elevator_cabin_width"), // cm
  elevatorCabinDepth: real("elevator_cabin_depth"), // cm
  elevatorHasAccessibleControls: boolean("elevator_has_accessible_controls"),

  // Piso
  floorType: floorTypeEnum("floor_type"),
  isNonSlip: boolean("is_non_slip"),

  // Degraus interiores
  hasInteriorSteps: boolean("has_interior_steps"),
  interiorStepCount: integer("interior_step_count"),

  // Espaco de manobra
  turningSpaceAvailable: real("turning_space_available"), // cm - diametro

  // Balcao
  counterHeight: real("counter_height"), // cm
  hasLowCounter: boolean("has_low_counter"), // balcao rebaixado para cadeira de rodas

  interiorNotes: text("interior_notes"),

  // ============================================
  // MESAS E ASSENTOS
  // ============================================

  hasAccessibleTables: boolean("has_accessible_tables"),
  accessibleTableCount: integer("accessible_table_count"),
  tableHeight: real("table_height"), // cm
  underTableClearance: real("under_table_clearance"), // cm - espaco para joelhos
  spaceBetweenTables: real("space_between_tables"), // cm

  // Esplanada
  hasOutdoorSeating: boolean("has_outdoor_seating"),
  outdoorSeatingAccessible: boolean("outdoor_seating_accessible"),

  seatingNotes: text("seating_notes"),

  // ============================================
  // CASA DE BANHO
  // ============================================

  hasAccessibleBathroom: boolean("has_accessible_bathroom"),
  bathroomDoorWidth: real("bathroom_door_width"), // cm
  bathroomTurningSpace: real("bathroom_turning_space"), // cm - diametro

  // Barras de apoio
  hasGrabBars: boolean("has_grab_bars"),
  grabBarSide: grabBarSideEnum("grab_bar_side"),

  // Sanita
  toiletSeatHeight: real("toilet_seat_height"), // cm

  // Lavatorio
  sinkHeight: real("sink_height"), // cm
  hasKneeSpaceUnderSink: boolean("has_knee_space_under_sink"),
  faucetType: faucetTypeEnum("faucet_type"),

  // Outros elementos da casa de banho
  hasMirrorAtWheelchairHeight: boolean("has_mirror_at_wheelchair_height"),
  hasEmergencyButton: boolean("has_emergency_button"),
  bathroomOnSameFloor: boolean("bathroom_on_same_floor"),

  bathroomNotes: text("bathroom_notes"),

  // ============================================
  // COMUNICACAO E EMENTA
  // ============================================

  hasBrailleMenu: boolean("has_braille_menu"),
  hasLargePrintMenu: boolean("has_large_print_menu"),
  hasDigitalMenu: boolean("has_digital_menu"),
  hasQRCodeMenu: boolean("has_qr_code_menu"),
  hasPictureMenu: boolean("has_picture_menu"),
  staffTrainedInAccessibility: boolean("staff_trained_in_accessibility"),
  hasHearingLoop: boolean("has_hearing_loop"),

  menuNotes: text("menu_notes"),

  // ============================================
  // METADADOS DE VERIFICACAO
  // ============================================

  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  verifiedById: uuid("verified_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  dataSource: dataSourceEnum("data_source").notNull().default("community"),
  confidenceScore: integer("confidence_score"), // 0-100 (confianca da IA)
  lastUpdatedById: uuid("last_updated_by_id").references(() => users.id, {
    onDelete: "set null",
  }),

  ...timestamps,
});
```

**Tabela de referencia normativa para campos de acessibilidade:**

| Campo                     | Unidade | Norma                   | Valor minimo recomendado                   |
| ------------------------- | ------- | ----------------------- | ------------------------------------------ |
| `entrance_door_width`     | cm      | ADA 404.2.3 / ISO 21542 | >= 81.3 cm (32 pol.) ADA; >= 80 cm ISO     |
| `ramp_incline`            | %       | ADA 405.2 / DL 163/2006 | <= 8.33% ADA; <= 6% PT (ideal)             |
| `ramp_has_handrails`      | bool    | ADA 405.8               | Obrigatorio se desnivel > 15 cm            |
| `parking_space_width`     | cm      | ADA 502.2               | >= 244 cm (96 pol.)                        |
| `access_aisle_width`      | cm      | ADA 502.3               | >= 152 cm (60 pol.) para van               |
| `corridor_min_width`      | cm      | ADA 403.5.1 / ISO 21542 | >= 91.4 cm (36 pol.) ADA; >= 120 cm ISO    |
| `elevator_door_width`     | cm      | ADA 407.3.6             | >= 91.4 cm (36 pol.)                       |
| `elevator_cabin_width`    | cm      | ADA 407.4.1             | >= 170 cm                                  |
| `elevator_cabin_depth`    | cm      | ADA 407.4.1             | >= 137 cm                                  |
| `turning_space_available` | cm      | ADA 304.3.1             | >= 152 cm (diametro)                       |
| `table_height`            | cm      | ADA 902.3               | 71-86 cm                                   |
| `under_table_clearance`   | cm      | ADA 306.3               | >= 68.5 cm (27 pol.)                       |
| `space_between_tables`    | cm      | ISO 21542               | >= 90 cm (passagem cadeira de rodas)       |
| `bathroom_door_width`     | cm      | ADA 404.2.3             | >= 81.3 cm (32 pol.)                       |
| `bathroom_turning_space`  | cm      | ADA 603.2.1             | >= 152 cm (diametro)                       |
| `toilet_seat_height`      | cm      | ADA 604.4               | 43-48 cm                                   |
| `sink_height`             | cm      | ADA 606.3               | <= 86 cm (borda superior)                  |
| `counter_height`          | cm      | ADA 904.4               | <= 91.4 cm (36 pol.) para balcao acessivel |
| `doorbell_height`         | cm      | ADA 308                 | 38-122 cm (alcance lateral)                |

**Relacoes:**

```typescript
export const accessibilityProfilesRelations = relations(accessibilityProfiles, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [accessibilityProfiles.restaurantId],
    references: [restaurants.id],
  }),
  verifiedBy: one(users, {
    fields: [accessibilityProfiles.verifiedById],
    references: [users.id],
    relationName: "verifiedProfiles",
  }),
  lastUpdatedBy: one(users, {
    fields: [accessibilityProfiles.lastUpdatedById],
    references: [users.id],
    relationName: "updatedProfiles",
  }),
}));
```

---

### 3.4 Pontuacao de Acessibilidade (AccessibilityScore)

Tabela de scores calculados/cache para cada restaurante. Os scores sao derivados dos dados do `AccessibilityProfile` e recalculados sempre que o perfil e actualizado (via trigger ou job agendado).

O campo `weighted_score_for_profile` permite pre-calcular scores ponderados para os perfis de mobilidade mais comuns, acelerando queries de listagem e ordenacao.

```typescript
// src/db/schema/accessibility-scores.ts
import { pgTable, uuid, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const accessibilityScores = pgTable("accessibility_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Score global (0-100)
  overallScore: real("overall_score").notNull(),

  // Scores por categoria (0-100)
  entranceScore: real("entrance_score"),
  parkingScore: real("parking_score"),
  interiorScore: real("interior_score"),
  bathroomScore: real("bathroom_score"),
  communicationScore: real("communication_score"),
  seatingScore: real("seating_score"),

  // Cache de scores ponderados por perfil de mobilidade
  // Formato: { "electric_wheelchair": 72, "manual_wheelchair": 85, "walker": 91, ... }
  weightedScoreForProfile: jsonb("weighted_score_for_profile"),

  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Algoritmo de calculo (resumo):**

Cada categoria tem um peso base e e ajustada consoante o perfil de mobilidade do utilizador:

| Categoria      | Peso base | Peso para cadeira electrica | Peso para andarilho |
| -------------- | --------- | --------------------------- | ------------------- |
| Entrada        | 25%       | 30%                         | 20%                 |
| Estacionamento | 10%       | 15%                         | 10%                 |
| Interior       | 20%       | 25%                         | 20%                 |
| Casa de banho  | 20%       | 15%                         | 20%                 |
| Comunicacao    | 10%       | 5%                          | 15%                 |
| Assentos       | 15%       | 10%                         | 15%                 |

**Relacoes:**

```typescript
export const accessibilityScoresRelations = relations(accessibilityScores, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [accessibilityScores.restaurantId],
    references: [restaurants.id],
  }),
}));
```

---

### 3.5 Avaliacao (Review)

Cada avaliacao e escrita por um utilizador sobre um restaurante, combinando classificacoes numericas (comida, servico, acessibilidade, global) com texto livre e metadados sobre a mobilidade no momento da visita.

O campo `embedding` permite pesquisa semantica sobre avaliacoes ("restaurantes com bom acesso para cadeiras electricas" encontra avaliacoes relevantes via similaridade vectorial).

```typescript
// src/db/schema/reviews.ts
import { pgTable, uuid, text, real, integer, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { vector } from "pgvector/drizzle-orm";
import { mobilityTypeEnum, timestamps } from "./shared";

export const reviewStatusEnum = pgEnum("review_status", ["pending", "published", "flagged", "removed"]);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),

    // Classificacoes (1-5, com precisao de 0.5)
    foodRating: real("food_rating").notNull(),
    serviceRating: real("service_rating").notNull(),
    accessibilityRating: real("accessibility_rating").notNull(),
    overallRating: real("overall_rating").notNull(),

    // Texto da avaliacao
    text: text("text"),

    // Data da visita (pode diferir da data da avaliacao)
    visitDate: date("visit_date"),

    // Contexto da visita
    mobilityTypeAtVisit: mobilityTypeEnum("mobility_type_at_visit"),
    companionCount: integer("companion_count"),

    // Metricas sociais
    helpfulCount: integer("helpful_count").notNull().default(0),

    // Moderacao
    status: reviewStatusEnum("status").notNull().default("pending"),

    // IA
    aiSummary: text("ai_summary"), // resumo gerado pelo Claude
    embedding: vector("embedding", { dimensions: 1024 }),

    ...timestamps,
  },
  (table) => [index("reviews_restaurant_idx").on(table.restaurantId), index("reviews_user_idx").on(table.userId), index("reviews_status_idx").on(table.status), index("reviews_visit_date_idx").on(table.visitDate)],
);
```

**Restricoes de negocio (implementadas na camada aplicacional ou via check constraints):**

- `food_rating`, `service_rating`, `accessibility_rating`, `overall_rating`: valores entre 1.0 e 5.0, incrementos de 0.5
- Um utilizador pode ter no maximo uma avaliacao por restaurante por mes
- Avaliacoes passam por moderacao automatica (IA) e manual antes de ficarem `published`

**Relacoes:**

```typescript
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
  photos: many(photos),
}));
```

---

### 3.6 Fotografia (Photo)

Tabela centralizada para todas as fotografias do sistema. Cada fotografia pode pertencer a um restaurante, a uma avaliacao, ou a um relatorio de verificacao. O campo `ai_accessibility_analysis` armazena a saida estruturada do Claude Vision para deteccao automatica de elementos de acessibilidade.

```typescript
// src/db/schema/photos.ts
import { pgTable, uuid, text, varchar, integer, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./shared";

export const photoCategoryEnum = pgEnum("photo_category", ["entrance", "ramp", "interior", "bathroom", "table", "menu", "parking", "exterior", "food", "other"]);

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    uploadedById: uuid("uploaded_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id").references(() => reviews.id, {
      onDelete: "set null",
    }),
    verificationReportId: uuid("verification_report_id").references(() => verificationReports.id, {
      onDelete: "set null",
    }),

    // URLs (armazenamento externo: S3-compatible ou volume Docker)
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),

    // Texto alternativo (gerado por IA, editavel pelo utilizador)
    altText: text("alt_text"),

    // Categoria da fotografia
    category: photoCategoryEnum("category").notNull().default("other"),

    // Analise de acessibilidade via Claude Vision
    // Formato: { "detected_elements": [...], "accessibility_issues": [...],
    //            "measurements_estimated": {...}, "confidence": 0.85 }
    aiAccessibilityAnalysis: jsonb("ai_accessibility_analysis"),

    // Dimensoes da imagem original
    width: integer("width"),
    height: integer("height"),

    // Apenas createdAt (fotografias nao sao editaveis, apenas adicionadas ou removidas)
    createdAt: timestamps.createdAt,
  },
  (table) => [index("photos_restaurant_idx").on(table.restaurantId), index("photos_review_idx").on(table.reviewId), index("photos_category_idx").on(table.category)],
);
```

**Formato do campo `ai_accessibility_analysis` (saida do Claude Vision):**

```jsonc
{
  "detected_elements": [
    {
      "type": "ramp",
      "present": true,
      "estimated_incline_percent": 7.5,
      "has_handrails": true,
      "condition": "good",
    },
    {
      "type": "door",
      "present": true,
      "estimated_width_cm": 90,
      "type_detail": "automatic_sliding",
      "condition": "good",
    },
  ],
  "accessibility_issues": ["Superficie exterior em calcada portuguesa - potencialmente irregular para cadeiras de rodas"],
  "overall_assessment": "Entrada acessivel com rampa adequada e porta automatica",
  "confidence": 0.85,
}
```

**Relacoes:**

```typescript
export const photosRelations = relations(photos, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [photos.uploadedById],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [photos.restaurantId],
    references: [restaurants.id],
  }),
  review: one(reviews, {
    fields: [photos.reviewId],
    references: [reviews.id],
  }),
  verificationReport: one(verificationReports, {
    fields: [photos.verificationReportId],
    references: [verificationReports.id],
  }),
}));
```

---

### 3.7 Ementa (Menu)

Cada restaurante pode ter multiplas ementas (almoco, jantar, fim de semana, especial, etc.). Os nomes e descricoes sao multilingues (JSON).

```typescript
// src/db/schema/menus.ts
import { pgTable, uuid, jsonb, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./shared";

export const menuTypeEnum = pgEnum("menu_type", ["regular", "lunch", "dinner", "weekend", "special", "drinks", "desserts"]);

export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Nome e descricao multilingues: { "pt": "...", "en": "..." }
  name: jsonb("name").notNull(),
  description: jsonb("description"),

  isActive: boolean("is_active").notNull().default(true),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  menuType: menuTypeEnum("menu_type").notNull().default("regular"),

  ...timestamps,
});
```

**Relacoes:**

```typescript
export const menusRelations = relations(menus, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menus.restaurantId],
    references: [restaurants.id],
  }),
  dishes: many(dishes),
}));
```

---

### 3.8 Prato (Dish)

Cada prato pertence a uma ementa. Inclui informacao de alergenos e restricoes alimentares (campos criticos para utilizadores com necessidades especificas). O campo `embedding` permite pesquisa semantica de pratos ("prato vegetariano sem gluten").

```typescript
// src/db/schema/dishes.ts
import { pgTable, uuid, jsonb, text, real, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { vector } from "pgvector/drizzle-orm";
import { timestamps } from "./shared";

export const dishCategoryEnum = pgEnum("dish_category", ["starter", "main", "dessert", "drink", "side", "other"]);

export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),

    // Nome e descricao multilingues: { "pt": "...", "en": "..." }
    name: jsonb("name").notNull(),
    description: jsonb("description"),

    // Preco em EUR (decimal com 2 casas)
    price: real("price"),

    category: dishCategoryEnum("category").notNull().default("main"),

    // Alergenos (codificacao EU: gluten, crustaceans, eggs, fish, peanuts,
    // soybeans, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs)
    allergens: text("allergens").array(),

    // Sinalizadores dieteticos
    // Valores possiveis: vegetarian, vegan, gluten_free, lactose_free,
    // sugar_free, low_sodium, halal, kosher, organic
    dietaryFlags: text("dietary_flags").array(),

    isAvailable: boolean("is_available").notNull().default(true),

    // Fotografia principal (referencia a tabela photos)
    photoId: uuid("photo_id").references(() => photos.id, {
      onDelete: "set null",
    }),

    // Embedding para pesquisa semantica de pratos
    embedding: vector("embedding", { dimensions: 1024 }),

    ...timestamps,
  },
  (table) => [index("dishes_menu_idx").on(table.menuId), index("dishes_category_idx").on(table.category), index("dishes_available_idx").on(table.isAvailable)],
);
```

**Relacoes:**

```typescript
export const dishesRelations = relations(dishes, ({ one }) => ({
  menu: one(menus, {
    fields: [dishes.menuId],
    references: [menus.id],
  }),
  photo: one(photos, {
    fields: [dishes.photoId],
    references: [photos.id],
  }),
}));
```

---

### 3.9 Reserva (Reservation)

A reserva integra informacao de acessibilidade do perfil do utilizador, pre-preenchendo o campo `accessibility_notes` automaticamente para que o restaurante possa preparar-se.

```typescript
// src/db/schema/reservations.ts
import { pgTable, uuid, text, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./shared";

export const reservationStatusEnum = pgEnum("reservation_status", ["pending", "confirmed", "cancelled", "completed", "no_show"]);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),

    // Data e hora da reserva
    dateTime: timestamp("date_time", { withTimezone: true }).notNull(),

    // Numero de pessoas
    partySize: integer("party_size").notNull(),

    // Notas de acessibilidade (pre-preenchidas a partir do perfil do utilizador)
    // Exemplo: "Cadeira de rodas electrica (largura 68cm). Necessito de mesa
    // acessivel e casa de banho adaptada. Transferencia lateral esquerda."
    accessibilityNotes: text("accessibility_notes"),

    // Pedidos especiais adicionais
    specialRequests: text("special_requests"),

    // Estado da reserva
    status: reservationStatusEnum("status").notNull().default("pending"),

    // Codigo de confirmacao (gerado automaticamente, 8 caracteres alfanumericos)
    confirmationCode: varchar("confirmation_code", { length: 20 }).notNull().unique(),

    ...timestamps,
  },
  (table) => [index("reservations_user_idx").on(table.userId), index("reservations_restaurant_idx").on(table.restaurantId), index("reservations_datetime_idx").on(table.dateTime), index("reservations_status_idx").on(table.status), index("reservations_confirmation_idx").on(table.confirmationCode)],
);
```

**Relacoes:**

```typescript
export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [reservations.restaurantId],
    references: [restaurants.id],
  }),
}));
```

---

### 3.10 Relatorio de Verificacao (VerificationReport)

Os relatorios de verificacao documentam visitas de inspecao ao restaurante, sejam comunitarias (qualquer utilizador), profissionais (auditores certificados) ou assistidas por IA (analise de fotografias).

```typescript
// src/db/schema/verification-reports.ts
import { pgTable, uuid, text, date, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./shared";

export const verificationTypeEnum = pgEnum("verification_type", ["community", "professional", "ai_assisted"]);

export const reportStatusEnum = pgEnum("report_status", ["draft", "submitted", "reviewed", "accepted", "rejected"]);

export const verificationReports = pgTable(
  "verification_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    verifierId: uuid("verifier_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: verificationTypeEnum("type").notNull(),
    visitDate: date("visit_date").notNull(),

    // Resultados estruturados da verificacao
    // Formato: { "entrance": { "door_width_measured": 85, "has_ramp": true, ... },
    //            "bathroom": { ... }, "interior": { ... } }
    findings: jsonb("findings").notNull(),

    // Avaliacao global em texto
    overallAssessment: text("overall_assessment"),

    // Lista de melhorias recomendadas
    // Exemplo: ["Instalar rampa na entrada lateral", "Alargar porta da casa de banho"]
    recommendedImprovements: text("recommended_improvements").array(),

    // Estado do relatorio
    status: reportStatusEnum("status").notNull().default("draft"),

    ...timestamps,
  },
  (table) => [index("verification_reports_restaurant_idx").on(table.restaurantId), index("verification_reports_verifier_idx").on(table.verifierId), index("verification_reports_status_idx").on(table.status)],
);
```

**Relacoes:**

```typescript
export const verificationReportsRelations = relations(verificationReports, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [verificationReports.restaurantId],
    references: [restaurants.id],
  }),
  verifier: one(users, {
    fields: [verificationReports.verifierId],
    references: [users.id],
  }),
  photos: many(photos),
}));
```

---

### 3.11 Traducao (Translation)

Sistema de traducoes generico que permite traduzir qualquer campo de qualquer entidade para qualquer locale. Utilizado como complemento ao JSON multilingue inline, especialmente para conteudo gerado por utilizadores (avaliacoes) ou para campos que necessitam de revisao humana.

```typescript
// src/db/schema/translations.ts
import { pgTable, uuid, varchar, text, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { timestamps } from "./shared";

export const translations = pgTable(
  "translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Entidade de origem (polimorfismo via tipo + ID)
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    field: varchar("field", { length: 100 }).notNull(),

    // Locale ISO 639-1 (pt, en, es, fr, de, it, etc.)
    locale: varchar("locale", { length: 10 }).notNull(),

    // Valor traduzido
    value: text("value").notNull(),

    // Metadados de qualidade
    isAiGenerated: boolean("is_ai_generated").notNull().default(false),
    isReviewed: boolean("is_reviewed").notNull().default(false),

    ...timestamps,
  },
  (table) => [
    // Garantir unicidade: uma traducao por entidade+campo+locale
    uniqueIndex("translations_unique_idx").on(table.entityType, table.entityId, table.field, table.locale),
    index("translations_entity_idx").on(table.entityType, table.entityId),
    index("translations_locale_idx").on(table.locale),
  ],
);
```

**Exemplos de utilizacao:**

| entity_type  | entity_id             | field            | locale | value                            |
| ------------ | --------------------- | ---------------- | ------ | -------------------------------- |
| `review`     | `uuid-da-avaliacao`   | `text`           | `en`   | "Great accessible restaurant..." |
| `review`     | `uuid-da-avaliacao`   | `text`           | `es`   | "Gran restaurante accesible..."  |
| `restaurant` | `uuid-do-restaurante` | `entrance_notes` | `en`   | "Level entrance via side door"   |

---

### 3.12 Registo de Auditoria (AuditLog)

Regista todas as alteracoes em dados sensiveis do sistema, especialmente em perfis de acessibilidade. Essencial para rastrear quem alterou que, quando e com que valores -- fundamental para a fiabilidade dos dados de acessibilidade.

```typescript
// src/db/schema/audit-logs.ts
import { pgTable, uuid, varchar, text, jsonb, index } from "drizzle-orm/pg-core";
import { timestamps } from "./shared";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Quem fez a accao
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Que accao foi feita
    action: varchar("action", { length: 50 }).notNull(),
    // Valores possiveis: create, update, delete, verify, flag,
    //                     publish, archive, claim, unclaim

    // Sobre que entidade
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),

    // Valores antes e depois (diff)
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),

    // Contexto do pedido HTTP
    ipAddress: varchar("ip_address", { length: 45 }), // suporta IPv6
    userAgent: text("user_agent"),

    // Apenas createdAt (logs nao sao editaveis)
    createdAt: timestamps.createdAt,
  },
  (table) => [index("audit_logs_user_idx").on(table.userId), index("audit_logs_entity_idx").on(table.entityType, table.entityId), index("audit_logs_action_idx").on(table.action), index("audit_logs_created_idx").on(table.createdAt)],
);
```

**Politica de retencao:** Os registos de auditoria sao imutaveis e nunca eliminados. Para gestao de espaco, pode implementar-se particionamento por data (partition by range em `created_at`) apos o primeiro ano de operacao.

---

## 4. Diagrama de Relacoes entre Entidades

```plaintext
+-------------------+       1:1       +-------------------------------+
|    users          |<--------------->| user_accessibility_profiles   |
|-------------------|                 |-------------------------------|
| id (PK)           |                 | id (PK)                       |
| email              |                 | user_id (FK, UNIQUE)          |
| name               |                 | mobility_type                 |
| locale             |                 | wheelchair_width              |
| avatar_url         |                 | wheelchair_length             |
| email_verified     |                 | turning_radius_needed         |
| created_at         |                 | max_ramp_incline              |
| updated_at         |                 | needs_elevator                |
+-------------------+                 | dietary_restrictions[]        |
      |                                | allergies[]                   |
      |                                | ...                           |
      |                                +-------------------------------+
      |
      | 1:N                    1:N                    1:N
      +------------------+--------------------+-----------------+
      |                  |                    |                 |
      v                  v                    v                 v
+----------+    +------------+    +---------------+    +-----------+
| reviews  |    | photos     |    | reservations  |    | audit_logs|
+----------+    +------------+    +---------------+    +-----------+
      |                  |
      |                  |
      +--------+---------+
               |
               v
+-----------------------------+       1:1       +------------------------+
|    restaurants              |<--------------->| accessibility_profiles |
|-----------------------------|                 |------------------------|
| id (PK)                     |                 | id (PK)                |
| name                        |                 | restaurant_id (FK, UQ) |
| slug (UNIQUE)               |                 | has_accessible_entrance|
| description (JSONB)         |                 | entrance_door_width    |
| address, city, postal_code  |                 | entrance_type          |
| latitude, longitude         |                 | has_ramp               |
| cuisine_types[]             |                 | ramp_incline           |
| price_range                 |                 | has_accessible_parking |
| opening_hours (JSONB)       |                 | corridor_min_width     |
| owner_id (FK -> users)      |                 | has_accessible_bathroom|
| status                      |                 | verification_status    |
| embedding vector(1024)      |                 | confidence_score       |
| created_at, updated_at      |                 | ...                    |
+-----------------------------+                 +------------------------+
      |            |          |
      |            |          |         1:1       +------------------------+
      |            |          +<---------------->| accessibility_scores   |
      |            |                              |------------------------|
      |            |                              | id (PK)                |
      |            |                              | restaurant_id (FK, UQ) |
      |            |                              | overall_score          |
      |            |                              | entrance_score         |
      |            |                              | parking_score          |
      |            |                              | interior_score         |
      |            |                              | bathroom_score         |
      |            |                              | weighted_score (JSONB) |
      |            |                              +------------------------+
      |            |
      |   1:N      |  1:N
      |            |
      v            v
+----------+  +------------------------+
| menus    |  | verification_reports   |
|----------|  |------------------------|
| id (PK)  |  | id (PK)                |
| rest_id  |  | restaurant_id (FK)     |
| name     |  | verifier_id (FK)       |
| type     |  | type                   |
| is_active|  | findings (JSONB)       |
+----------+  | status                 |
      |       +------------------------+
      | 1:N
      v
+-------------------+
| dishes            |
|-------------------|
| id (PK)           |
| menu_id (FK)      |
| name (JSONB)      |
| price             |
| allergens[]       |
| dietary_flags[]   |
| photo_id (FK)     |
| embedding (1024)  |
+-------------------+


+-------------------+
| translations      |
|-------------------|                  Tabela polimorfica:
| id (PK)           |                  - entity_type + entity_id
| entity_type       |<- - - - - - -    referenciam qualquer
| entity_id         |                  entidade do sistema
| field             |
| locale            |
| value             |
| is_ai_generated   |
+-------------------+
```

**Resumo de cardinalidades:**

| Relacao                                | Cardinalidade | Tipo                                 |
| -------------------------------------- | ------------- | ------------------------------------ |
| users <-> user_accessibility_profiles  | 1:1           | Obrigatoria (apos registo)           |
| restaurants <-> accessibility_profiles | 1:1           | Opcional (pode nao ter dados ainda)  |
| restaurants <-> accessibility_scores   | 1:1           | Opcional (calculado quando ha dados) |
| users -> reviews                       | 1:N           | Opcional                             |
| restaurants -> reviews                 | 1:N           | Opcional                             |
| users -> photos                        | 1:N           | Opcional                             |
| restaurants -> photos                  | 1:N           | Opcional                             |
| reviews -> photos                      | 1:N           | Opcional                             |
| restaurants -> menus                   | 1:N           | Opcional                             |
| menus -> dishes                        | 1:N           | Opcional                             |
| restaurants -> reservations            | 1:N           | Opcional                             |
| users -> reservations                  | 1:N           | Opcional                             |
| restaurants -> verification_reports    | 1:N           | Opcional                             |
| users -> verification_reports          | 1:N           | Opcional                             |
| verification_reports -> photos         | 1:N           | Opcional                             |
| \* -> translations                     | 1:N           | Polimorfica                          |
| \* -> audit_logs                       | 1:N           | Polimorfica                          |

---

## 5. Indices e Estrategia de Performance

### 5.1 Indices para pgvector (Pesquisa Semantica)

Os indices HNSW (Hierarchical Navigable Small World) sao os recomendados para pgvector em producao, oferecendo <20ms de latencia para 1M de vectores com >95% de recall.

```sql
-- Indice HNSW para pesquisa semantica de restaurantes
-- Distancia coseno e a mais adequada para embeddings de texto
CREATE INDEX restaurants_embedding_idx
  ON restaurants
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Indice HNSW para pesquisa semantica de avaliacoes
CREATE INDEX reviews_embedding_idx
  ON reviews
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Indice HNSW para pesquisa semantica de pratos
CREATE INDEX dishes_embedding_idx
  ON dishes
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Parametros HNSW:**

| Parametro         | Valor | Justificacao                                                                              |
| ----------------- | ----- | ----------------------------------------------------------------------------------------- |
| `m`               | 16    | Numero de ligacoes por no. 16 e o valor por defeito e equilibrado para datasets < 1M      |
| `ef_construction` | 64    | Qualidade de construcao do indice. Valores maiores = melhor recall, construcao mais lenta |

Em consulta, ajustar `ef_search` consoante o trade-off desejado entre velocidade e recall:

```sql
-- Para pesquisa de alta qualidade (recomendacoes personalizadas)
SET hnsw.ef_search = 100;

-- Para pesquisa rapida (autocompletar, sugestoes)
SET hnsw.ef_search = 40;
```

### 5.2 Indices para Consultas Geoespaciais

Sem PostGIS, as consultas de proximidade utilizam a extensao `earthdistance` (incluida no PostgreSQL) ou calculo de Haversine. Para indexar, utiliza-se um indice composto ou, preferencialmente, GiST com `cube`/`earthdistance`.

```sql
-- Activar extensoes necessarias
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Indice GiST para consultas de proximidade
CREATE INDEX restaurants_location_gist_idx
  ON restaurants
  USING gist (ll_to_earth(latitude, longitude));

-- Exemplo de consulta: restaurantes num raio de 5 km de um ponto
SELECT *
FROM restaurants
WHERE earth_box(ll_to_earth(38.7223, -9.1393), 5000)
  @> ll_to_earth(latitude, longitude)
  AND earth_distance(
    ll_to_earth(38.7223, -9.1393),
    ll_to_earth(latitude, longitude)
  ) <= 5000
ORDER BY earth_distance(
  ll_to_earth(38.7223, -9.1393),
  ll_to_earth(latitude, longitude)
);
```

### 5.3 Indices para Filtros Comuns

```sql
-- Pesquisa full-text em portugues para nomes e descricoes de restaurantes
-- Requer configuracao de dicionario portugues no PostgreSQL
ALTER TABLE restaurants ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(address, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(city, '')), 'B')
  ) STORED;

CREATE INDEX restaurants_search_idx
  ON restaurants
  USING gin (search_vector);

-- Indice parcial para restaurantes activos (a maioria das queries filtra por status = 'active')
CREATE INDEX restaurants_active_idx
  ON restaurants (city, price_range)
  WHERE status = 'active';

-- Indice parcial para avaliacoes publicadas
CREATE INDEX reviews_published_idx
  ON reviews (restaurant_id, overall_rating)
  WHERE status = 'published';

-- Indice para reservas futuras
CREATE INDEX reservations_upcoming_idx
  ON reservations (restaurant_id, date_time)
  WHERE status IN ('pending', 'confirmed');

-- Indice para auditoria recente
CREATE INDEX audit_logs_recent_idx
  ON audit_logs (created_at DESC)
  WHERE created_at > NOW() - INTERVAL '90 days';
```

### 5.4 Indices para Acessibilidade (Consultas Frequentes)

```sql
-- Indice composto para filtros comuns de acessibilidade
CREATE INDEX accessibility_profiles_main_filters_idx
  ON accessibility_profiles (
    has_accessible_entrance,
    has_accessible_bathroom,
    has_accessible_parking
  );

-- Indice para status de verificacao
CREATE INDEX accessibility_profiles_verification_idx
  ON accessibility_profiles (verification_status, last_verified_at);

-- Indice para scores de acessibilidade (ordenacao)
CREATE INDEX accessibility_scores_overall_idx
  ON accessibility_scores (overall_score DESC);
```

---

## 6. Estrategia de Migracoes

### 6.1 Ferramenta

As migracoes sao geridas pelo **Drizzle Kit** (`drizzle-kit`), a ferramenta CLI oficial do Drizzle ORM.

### 6.2 Fluxo de Trabalho

```plaintext
1. Alterar esquema em src/db/schema/*.ts
2. Gerar migracao:  pnpm drizzle-kit generate
3. Inspeccionar SQL gerado em drizzle/migrations/
4. Aplicar migracao:  pnpm drizzle-kit migrate
5. Em desenvolvimento: alternativamente usar  pnpm drizzle-kit push  (aplica directamente sem ficheiro de migracao)
```

### 6.3 Configuracao do Drizzle Kit

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### 6.4 Ordem de Criacao das Tabelas

Dadas as dependencias de chaves estrangeiras, a ordem de criacao e:

1. `users` (sem dependencias)
2. `user_accessibility_profiles` (depende de `users`)
3. `restaurants` (depende de `users` para `owner_id`)
4. `accessibility_profiles` (depende de `restaurants`, `users`)
5. `accessibility_scores` (depende de `restaurants`)
6. `reviews` (depende de `users`, `restaurants`)
7. `menus` (depende de `restaurants`)
8. `dishes` (depende de `menus`)
9. `verification_reports` (depende de `restaurants`, `users`)
10. `photos` (depende de `users`, `restaurants`, `reviews`, `verification_reports`)
11. `reservations` (depende de `users`, `restaurants`)
12. `translations` (sem FKs -- polimorfica)
13. `audit_logs` (depende de `users`, mas com `SET NULL`)

### 6.5 Extensoes PostgreSQL Necessarias

```sql
-- Executar antes da primeira migracao
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector
CREATE EXTENSION IF NOT EXISTS "cube";           -- para earthdistance
CREATE EXTENSION IF NOT EXISTS "earthdistance";  -- consultas de proximidade
-- Opcional: CREATE EXTENSION IF NOT EXISTS "pg_uuidv7"; -- para UUID v7 nativo
```

### 6.6 Regras para Migracoes em Producao

- **Nunca** remover colunas directamente. Primeiro marcar como `@deprecated`, depois remover numa migracao futura apos confirmar que nenhum codigo as utiliza.
- **Sempre** adicionar novas colunas com `DEFAULT` ou como `nullable` para evitar locks de tabela.
- **Indices** concorrentes: em tabelas grandes, usar `CREATE INDEX CONCURRENTLY` para evitar bloqueio de escritas.
- **Backfills** de dados devem correr em batch (ex.: 1000 registos por iteracao) para nao sobrecarregar a base de dados.

---

## 7. Estrategia de Povoamento Inicial (Seeding)

### 7.1 Fontes de Dados

| Fonte                              | Tipo de dados                                     | Metodo de importacao               |
| ---------------------------------- | ------------------------------------------------- | ---------------------------------- |
| **Wheelmap / accessibility.cloud** | Dados de acessibilidade basicos (A11yJSON)        | API publica + script de importacao |
| **OpenStreetMap (OSM)**            | Localizacao, nome, tipo de cozinha, horarios      | API Overpass + transformacao       |
| **Google Places API**              | Detalhes adicionais, fotografias, avaliacoes      | API (com limites de uso)           |
| **TripAdvisor**                    | Avaliacoes, classificacoes                        | Web scraping (respeitar ToS)       |
| **Dados manuais**                  | Restaurantes locais nao cobertos por APIs         | Formulario de contribuicao         |
| **Claude Vision**                  | Analise de acessibilidade a partir de fotografias | Pipeline automatizado              |

### 7.2 Script de Seed para Desenvolvimento

```typescript
// scripts/seed.ts
import { db } from "../src/db";
import { users, restaurants, accessibilityProfiles } from "../src/db/schema";

async function seed() {
  console.log("A iniciar seed da base de dados...");

  // 1. Criar utilizadores de teste
  const [testUser] = await db
    .insert(users)
    .values({
      email: "teste@eatoutadviser.pt",
      name: "Utilizador de Teste",
      locale: "pt",
      emailVerified: true,
    })
    .returning();

  // 2. Criar restaurantes de exemplo (Lisboa)
  const [restaurant] = await db
    .insert(restaurants)
    .values({
      name: "Restaurante Exemplo Acessivel",
      slug: "restaurante-exemplo-acessivel-lisboa",
      description: {
        pt: "Restaurante com acessibilidade total no centro de Lisboa.",
        en: "Fully accessible restaurant in Lisbon city centre.",
      },
      address: "Rua Augusta 100",
      city: "Lisboa",
      postalCode: "1100-053",
      district: "Lisboa",
      country: "PT",
      latitude: 38.7103,
      longitude: -9.1368,
      cuisineTypes: ["portuguesa", "mediterranea"],
      priceRange: "moderate",
      status: "active",
    })
    .returning();

  // 3. Criar perfil de acessibilidade completo
  await db.insert(accessibilityProfiles).values({
    restaurantId: restaurant.id,
    hasAccessibleEntrance: true,
    entranceDoorWidth: 90,
    entranceType: "automatic",
    hasLevelEntrance: true,
    hasRamp: false,
    numberOfSteps: 0,
    exteriorSurfaceType: "smooth",
    entranceLighting: "well_lit",
    hasAccessibleParking: true,
    accessibleParkingSpaces: 2,
    parkingDistanceToEntrance: 15,
    corridorMinWidth: 120,
    hasElevator: false,
    floorType: "smooth_tile",
    isNonSlip: true,
    hasInteriorSteps: false,
    turningSpaceAvailable: 160,
    hasAccessibleTables: true,
    accessibleTableCount: 4,
    tableHeight: 75,
    underTableClearance: 70,
    spaceBetweenTables: 100,
    hasAccessibleBathroom: true,
    bathroomDoorWidth: 85,
    bathroomTurningSpace: 155,
    hasGrabBars: true,
    grabBarSide: "both",
    toiletSeatHeight: 45,
    sinkHeight: 80,
    hasKneeSpaceUnderSink: true,
    faucetType: "lever",
    hasMirrorAtWheelchairHeight: true,
    hasEmergencyButton: true,
    bathroomOnSameFloor: true,
    hasDigitalMenu: true,
    hasQRCodeMenu: true,
    verificationStatus: "community_verified",
    dataSource: "community",
    confidenceScore: 85,
  });

  console.log("Seed concluido com sucesso.");
}

seed().catch(console.error);
```

### 7.3 Pipeline de Importacao OSM

```plaintext
1. Query Overpass API por restaurantes em Portugal
   -> amenity=restaurant dentro de bounding box do distrito
2. Transformar dados OSM -> formato restaurants (nome, morada, coords, cozinha)
3. Extrair tags de acessibilidade OSM:
   - wheelchair=yes/no/limited -> has_accessible_entrance (mapeamento aproximado)
   - toilets:wheelchair=yes/no -> has_accessible_bathroom
4. Inserir na base de dados com data_source='import' e verification_status='unverified'
5. Gerar embeddings com nomic-embed-text-v2 via Ollama
6. Para restaurantes com fotografias disponiveis: executar Claude Vision para analise
```

### 7.4 Geracao de Embeddings

```typescript
// scripts/generate-embeddings.ts
// Gera embeddings para restaurantes, avaliacoes e pratos sem embedding

import { db } from "../src/db";
import { restaurants } from "../src/db/schema";
import { isNull, eq } from "drizzle-orm";

async function generateEmbeddings() {
  // Buscar restaurantes sem embedding
  const pending = await db.select().from(restaurants).where(isNull(restaurants.embedding)).limit(100);

  for (const restaurant of pending) {
    // Compor texto para embedding
    const text = [restaurant.name, JSON.stringify(restaurant.description), restaurant.address, restaurant.city, (restaurant.cuisineTypes ?? []).join(", ")].join(" | ");

    // Chamar Ollama (API compativel com OpenAI)
    const response = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      body: JSON.stringify({
        model: "nomic-embed-text-v2",
        prompt: text,
      }),
    });
    const { embedding } = await response.json();

    // Actualizar registo com o embedding gerado
    await db.update(restaurants).set({ embedding }).where(eq(restaurants.id, restaurant.id));
  }
}

generateEmbeddings().catch(console.error);
```

---

## 8. Compatibilidade com A11yJSON

### 8.1 O que e o A11yJSON

O **A11yJSON** e um formato de dados aberto criado pela Sozialhelden (a organizacao por detras do Wheelmap.org) e mantido pelo projecto accessibility.cloud. Define um esquema JSON padronizado para descrever a acessibilidade de locais fisicos.

Repositorio: `github.com/sozialhelden/a11yjson`

### 8.2 Mapeamento AccessibilityProfile -> A11yJSON

O modelo de dados do Eat Out Adviser foi desenhado para ser compativel com A11yJSON, permitindo importacao e exportacao de dados sem perda significativa de informacao.

| Campo Eat Out Adviser       | Campo A11yJSON                                          | Notas                                   |
| --------------------------- | ------------------------------------------------------- | --------------------------------------- |
| `has_accessible_entrance`   | `accessibility.entrances[0].isLevel`                    | A11yJSON usa array de entradas          |
| `entrance_door_width`       | `accessibility.entrances[0].door.width`                 | Em metros no A11yJSON (converter de cm) |
| `entrance_type`             | `accessibility.entrances[0].door.isAutomatic`           | A11yJSON usa booleano, nao enum         |
| `has_ramp`                  | `accessibility.entrances[0].hasFixedRamp`               |                                         |
| `ramp_incline`              | `accessibility.entrances[0].ramp.incline`               | Mesmo formato (percentagem)             |
| `has_accessible_parking`    | `accessibility.parking.forWheelchairUsers.isAvailable`  |                                         |
| `accessible_parking_spaces` | `accessibility.parking.forWheelchairUsers.count`        |                                         |
| `corridor_min_width`        | `accessibility.areas[0].pathways[0].width`              | Em metros no A11yJSON                   |
| `has_elevator`              | `accessibility.areas[0].lifts[0].isAvailable`           |                                         |
| `has_accessible_bathroom`   | `accessibility.restrooms[0].isAccessibleWithWheelchair` |                                         |
| `bathroom_door_width`       | `accessibility.restrooms[0].entrance.door.width`        | Em metros no A11yJSON                   |
| `has_grab_bars`             | `accessibility.restrooms[0].hasGrabBars`                |                                         |
| `toilet_seat_height`        | `accessibility.restrooms[0].toilet.heightOfBase`        | Em metros no A11yJSON                   |

### 8.3 Funcao de Exportacao para A11yJSON

```typescript
// src/lib/a11yjson-export.ts

interface A11yJSONPlace {
  properties: {
    name: string;
    category: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      countryCode: string;
    };
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  accessibility: {
    entrances?: Array<{
      isLevel?: boolean;
      hasFixedRamp?: boolean;
      ramp?: { incline?: number };
      door?: {
        width?: number; // metros
        isAutomatic?: boolean;
      };
    }>;
    parking?: {
      forWheelchairUsers?: {
        isAvailable?: boolean;
        count?: number;
      };
    };
    restrooms?: Array<{
      isAccessibleWithWheelchair?: boolean;
      entrance?: {
        door?: { width?: number };
      };
      hasGrabBars?: boolean;
      toilet?: { heightOfBase?: number };
      turningSpaceDiameter?: number;
    }>;
  };
}

export function toA11yJSON(restaurant: Restaurant, profile: AccessibilityProfile): A11yJSONPlace {
  return {
    properties: {
      name: restaurant.name,
      category: "restaurant",
      address: {
        street: restaurant.address,
        city: restaurant.city,
        postalCode: restaurant.postalCode,
        countryCode: restaurant.country,
      },
    },
    geometry: {
      type: "Point",
      coordinates: [restaurant.longitude, restaurant.latitude],
    },
    accessibility: {
      entrances: [
        {
          isLevel: profile.hasLevelEntrance ?? undefined,
          hasFixedRamp: profile.hasRamp ?? undefined,
          ramp: profile.rampIncline ? { incline: profile.rampIncline } : undefined,
          door: {
            width: profile.entranceDoorWidth
              ? profile.entranceDoorWidth / 100 // cm -> metros
              : undefined,
            isAutomatic: profile.entranceType === "automatic" || undefined,
          },
        },
      ],
      parking: {
        forWheelchairUsers: {
          isAvailable: profile.hasAccessibleParking ?? undefined,
          count: profile.accessibleParkingSpaces ?? undefined,
        },
      },
      restrooms: profile.hasAccessibleBathroom
        ? [
            {
              isAccessibleWithWheelchair: profile.hasAccessibleBathroom,
              entrance: {
                door: profile.bathroomDoorWidth ? { width: profile.bathroomDoorWidth / 100 } : undefined,
              },
              hasGrabBars: profile.hasGrabBars ?? undefined,
              toilet: profile.toiletSeatHeight ? { heightOfBase: profile.toiletSeatHeight / 100 } : undefined,
              turningSpaceDiameter: profile.bathroomTurningSpace ? profile.bathroomTurningSpace / 100 : undefined,
            },
          ]
        : undefined,
    },
  };
}
```

### 8.4 Funcao de Importacao de A11yJSON

```typescript
// src/lib/a11yjson-import.ts

export function fromA11yJSON(place: A11yJSONPlace): Partial<AccessibilityProfile> {
  const entrance = place.accessibility?.entrances?.[0];
  const parking = place.accessibility?.parking?.forWheelchairUsers;
  const restroom = place.accessibility?.restrooms?.[0];

  return {
    // Entrada
    hasLevelEntrance: entrance?.isLevel,
    hasAccessibleEntrance: entrance?.isLevel || entrance?.hasFixedRamp || undefined,
    hasRamp: entrance?.hasFixedRamp,
    rampIncline: entrance?.ramp?.incline,
    entranceDoorWidth: entrance?.door?.width
      ? entrance.door.width * 100 // metros -> cm
      : undefined,
    entranceType: entrance?.door?.isAutomatic ? "automatic" : undefined,

    // Estacionamento
    hasAccessibleParking: parking?.isAvailable,
    accessibleParkingSpaces: parking?.count,

    // Casa de banho
    hasAccessibleBathroom: restroom?.isAccessibleWithWheelchair,
    bathroomDoorWidth: restroom?.entrance?.door?.width ? restroom.entrance.door.width * 100 : undefined,
    hasGrabBars: restroom?.hasGrabBars,
    toiletSeatHeight: restroom?.toilet?.heightOfBase ? restroom.toilet.heightOfBase * 100 : undefined,
    bathroomTurningSpace: restroom?.turningSpaceDiameter ? restroom.turningSpaceDiameter * 100 : undefined,

    // Metadados
    dataSource: "import",
    verificationStatus: "unverified",
  };
}
```

### 8.5 Notas sobre Limitacoes do Mapeamento

O modelo de dados do Eat Out Adviser e **mais granular** que o A11yJSON em varias areas, nomeadamente:

- **Tipo de entrada** (6 opcoes enum vs booleano `isAutomatic`)
- **Superficie exterior** (5 tipos vs nao coberto no A11yJSON base)
- **Detalhes da casa de banho** (tipo de torneira, lado das barras, botao de emergencia)
- **Assentos e mesas** (altura, espaco entre mesas, esplanada -- nao coberto no A11yJSON)
- **Comunicacao/ementa** (menu Braille, menu digital, formacao de staff -- nao coberto no A11yJSON)

Na exportacao para A11yJSON, estes campos adicionais podem ser incluidos no campo `extensions` do A11yJSON (previsto na especificacao para dados especificos de aplicacao).

Na importacao de A11yJSON, os campos nao mapeados ficam como `null` (nao preenchidos) e sao marcados como `verification_status = 'unverified'` para posterior complemento pela comunidade ou por analise de IA.
