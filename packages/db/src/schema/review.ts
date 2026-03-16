import { relations } from "drizzle-orm";
import { boolean, date, integer, pgTable, text, uuid, varchar, vector } from "drizzle-orm/pg-core";

import { restaurants } from "./restaurant";
import { timestamps } from "./shared";
import { users } from "./user";

// --- Tabela: reviews ---

/** Avaliacoes de restaurantes feitas por utilizadores */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Classificacoes (1-5)
  foodRating: integer("food_rating").notNull(),
  serviceRating: integer("service_rating").notNull(),
  ambienceRating: integer("ambience_rating").notNull(),

  // Texto da avaliacao
  comment: text("comment"),

  // Data da visita (pode diferir da data da avaliacao)
  visitDate: date("visit_date"),

  // Embedding vectorial para pesquisa semantica
  embedding: vector("embedding", { dimensions: 1024 }),

  // Visita verificada
  isVerifiedVisit: boolean("is_verified_visit").notNull().default(false),

  // Moderacao
  status: varchar("status", { length: 20 }).notNull().default("pending"),

  ...timestamps,
});

// --- Tabela: review_accessibility_ratings ---

/** Classificacoes detalhadas de acessibilidade associadas a uma avaliacao */
export const reviewAccessibilityRatings = pgTable("review_accessibility_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),

  // Classificacao geral de acessibilidade (1-5)
  overallAccessibilityRating: integer("overall_accessibility_rating").notNull(),

  // Classificacoes por categoria (1-5)
  entranceRating: integer("entrance_rating"),
  parkingRating: integer("parking_rating"),
  interiorRating: integer("interior_rating"),
  seatingRating: integer("seating_rating"),
  bathroomRating: integer("bathroom_rating"),
  communicationRating: integer("communication_rating"),

  // Comentario especifico sobre acessibilidade
  accessibilityComment: text("accessibility_comment"),

  ...timestamps,
});

// --- Relacoes ---

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
  accessibilityRating: one(reviewAccessibilityRatings),
}));

export const reviewAccessibilityRatingsRelations = relations(
  reviewAccessibilityRatings,
  ({ one }) => ({
    review: one(reviews, {
      fields: [reviewAccessibilityRatings.reviewId],
      references: [reviews.id],
    }),
  }),
);
