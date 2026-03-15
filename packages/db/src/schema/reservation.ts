import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { restaurants } from "./restaurant.js";
import { timestamps } from "./shared.js";
import { users } from "./user.js";

// --- Tabela: reservations ---

/** Reservas de restaurantes com notas de acessibilidade pre-preenchidas */
export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Data e hora da reserva
  dateTime: timestamp("date_time", { withTimezone: true }).notNull(),

  // Numero de pessoas
  partySize: integer("party_size").notNull(),

  // Notas de acessibilidade (pre-preenchidas a partir do perfil do utilizador)
  accessibilityNeeds: text("accessibility_needs"),

  // Pedidos especiais adicionais
  specialRequests: text("special_requests"),

  // Estado da reserva
  status: varchar("status", { length: 20 }).notNull().default("pending"),

  ...timestamps,
});

// --- Relacoes ---

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
