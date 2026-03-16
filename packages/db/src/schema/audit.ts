import { index, jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "./shared";
import { users } from "./user";

// --- Tabela: audit_logs ---

/** Registo de auditoria para rastreio de todas as alteracoes em dados sensiveis */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Sobre que entidade
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),

    // Que accao foi feita (create, update, delete)
    action: varchar("action", { length: 50 }).notNull(),

    // Quem fez a accao
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    // Valores antes e depois (diff)
    changes: jsonb("changes"),

    // Contexto do pedido HTTP
    ipAddress: varchar("ip_address", { length: 45 }),

    ...timestamps,
  },
  (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId)],
);
