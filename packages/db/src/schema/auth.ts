import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "./shared";
import { users } from "./user";

// =============================================================================
// Tabelas geridas pelo Better Auth
// =============================================================================
// Estas tabelas sao criadas e mantidas pelo Better Auth e os seus plugins.
// Definidas manualmente para manter as convencoes do projecto (snake_case,
// timestamps helper, uuid PKs onde aplicavel).
// =============================================================================

// --- Tabela: sessions ---

/** Sessoes activas dos utilizadores. Gerida pelo Better Auth. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  // Campo do plugin admin (impersonacao)
  impersonatedBy: uuid("impersonated_by"),

  ...timestamps,
});

// --- Tabela: accounts ---

/** Contas de autenticacao (email/password + OAuth providers). Gerida pelo Better Auth. */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),

  // Tokens OAuth
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),

  // Password hash (para autenticacao email/password)
  password: text("password"),

  ...timestamps,
});

// --- Tabela: verifications ---

/** Tokens de verificacao (email, password reset, etc.). Gerida pelo Better Auth. */
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

// --- Tabela: two_factors ---

/** Configuracao 2FA por utilizador. Gerida pelo plugin twoFactor. */
export const twoFactors = pgTable("two_factors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  ...timestamps,
});

// --- Tabela: passkeys ---

/**
 * Credenciais WebAuthn (passkeys). Gerida pelo plugin passkey.
 * O ID e text (nao uuid) porque o WebAuthn credential ID e um blob base64url.
 */
export const passkeys = pgTable("passkeys", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  counter: integer("counter").notNull().default(0),
  deviceType: varchar("device_type", { length: 32 }),
  backedUp: boolean("backed_up").notNull().default(false),
  transports: text("transports"),
  ...timestamps,
});

// --- Relacoes ---

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const twoFactorsRelations = relations(twoFactors, ({ one }) => ({
  user: one(users, { fields: [twoFactors.userId], references: [users.id] }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, { fields: [passkeys.userId], references: [users.id] }),
}));
