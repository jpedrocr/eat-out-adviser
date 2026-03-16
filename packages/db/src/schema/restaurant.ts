import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

import { accessibilityProfiles, accessibilityScores } from "./accessibility";
import { menus } from "./menu";
import { photos } from "./photo";
import { reservations } from "./reservation";
import { reviews } from "./review";
import { priceRangeEnum, restaurantStatusEnum, timestamps } from "./shared";
import { users } from "./user";
import { verificationReports } from "./verification";

// --- Tabela: restaurants ---

/** Tabela central de restaurantes com dados de localizacao, contacto e embeddings vectoriais */
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
    openingHours: jsonb("opening_hours"),

    capacity: integer("capacity"),

    // Gestao
    isClaimedByOwner: boolean("is_claimed_by_owner").notNull().default(false),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    status: restaurantStatusEnum("status").notNull().default("pending"),

    // Medias de avaliacao (caches desnormalizados, actualizados por trigger ou job)
    averageFoodRating: real("average_food_rating"),
    averageServiceRating: real("average_service_rating"),
    averageAccessibilityScore: real("average_accessibility_score"),

    // Embedding vectorial para pesquisa semantica (RAG com pgvector)
    embedding: vector("embedding", { dimensions: 1024 }),

    ...timestamps,
  },
  (table) => [
    index("restaurants_slug_idx").on(table.slug),
    index("restaurants_city_idx").on(table.city),
    index("restaurants_status_idx").on(table.status),
    index("restaurants_owner_idx").on(table.ownerId),
    index("restaurants_coords_idx").on(table.latitude, table.longitude),
  ],
);

// --- Relacoes ---

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
