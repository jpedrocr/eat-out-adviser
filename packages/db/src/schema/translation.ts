import { boolean, index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "./shared.js";

// --- Tabela: translations ---

/** Sistema de traducoes generico (polimorfismo via entityType + entityId) */
export const translations = pgTable(
  "translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Entidade de origem
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    field: varchar("field", { length: 100 }).notNull(),

    // Locale ISO 639-1
    locale: varchar("locale", { length: 10 }).notNull(),

    // Valor traduzido
    content: text("content").notNull(),

    // Metadados de qualidade
    isAiGenerated: boolean("is_ai_generated").notNull().default(false),

    ...timestamps,
  },
  (table) => [
    index("translations_entity_locale_idx").on(
      table.entityType,
      table.entityId,
      table.field,
      table.locale,
    ),
  ],
);
