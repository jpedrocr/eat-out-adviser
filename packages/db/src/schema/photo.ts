import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { restaurants } from "./restaurant";
import { timestamps } from "./shared";
import { users } from "./user";

// --- Tabela: photos ---

/** Fotografias de restaurantes com analise de acessibilidade por IA */
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // URL da fotografia (armazenamento externo)
  url: text("url").notNull(),

  // Legenda / texto alternativo
  caption: text("caption"),

  // Analise de acessibilidade via IA (Gemini Vision)
  aiAnalysis: jsonb("ai_analysis"),

  // Etiquetas de acessibilidade detectadas
  accessibilityTags: text("accessibility_tags").array(),

  // Categoria da fotografia
  category: varchar("category", { length: 20 }).notNull().default("other"),

  ...timestamps,
});

// --- Relacoes ---

export const photosRelations = relations(photos, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [photos.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
}));
