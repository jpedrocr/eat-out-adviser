import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { restaurants } from "./restaurant";
import { timestamps } from "./shared";
import { users } from "./user";

// --- Tabela: verification_reports ---

/** Relatorios de verificacao de acessibilidade (comunitarios, profissionais ou assistidos por IA) */
export const verificationReports = pgTable("verification_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  verifierId: uuid("verifier_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Tipo de verificacao
  type: varchar("type", { length: 20 }).notNull(),

  // Estado do relatorio
  status: varchar("status", { length: 20 }).notNull().default("pending"),

  // Dados recolhidos durante a verificacao (estrutura JSON livre)
  data: jsonb("data"),

  // Notas do verificador
  notes: text("notes"),

  // URLs de fotografias associadas
  photos: text("photos").array(),

  // Data da verificacao
  verifiedAt: timestamp("verified_at", { withTimezone: true }),

  ...timestamps,
});

// --- Relacoes ---

export const verificationReportsRelations = relations(verificationReports, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [verificationReports.restaurantId],
    references: [restaurants.id],
  }),
  verifier: one(users, {
    fields: [verificationReports.verifierId],
    references: [users.id],
  }),
}));
