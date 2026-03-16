import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { photos } from "./photo";
import { reservations } from "./reservation";
import { restaurants } from "./restaurant";
import { reviews } from "./review";
import { bathroomTransferSideEnum, mobilityTypeEnum, timestamps } from "./shared";

// --- Tabela: users ---

/** Tabela de utilizadores registados. A autenticacao e gerida pelo Better Auth. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  locale: varchar("locale", { length: 10 }).notNull().default("pt"),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),

  // -- Campos do plugin admin (RBAC) --
  role: varchar("role", { length: 50 }).notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),

  // -- Campo do plugin twoFactor --
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),

  ...timestamps,
});

// --- Tabela: user_accessibility_profiles ---

/** Perfil de acessibilidade do utilizador (relacao 1:1 com users) */
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
  maxRampIncline: real("max_ramp_incline"),
  maxStepHeight: real("max_step_height"),
  needsElevator: boolean("needs_elevator").notNull().default(true),
  needsAccessibleBathroom: boolean("needs_accessible_bathroom").notNull().default(true),
  bathroomTransferSide:
    bathroomTransferSideEnum("bathroom_transfer_side").default("not_applicable"),
  doorOpeningForceLimit: real("door_opening_force_limit"),

  // Contexto social
  companionCount: integer("companion_count").default(1),

  // Preferencias alimentares
  dietaryRestrictions: text("dietary_restrictions").array(),
  allergies: text("allergies").array(),
  preferredCuisines: text("preferred_cuisines").array(),

  // Logistica
  maxDistanceFromParking: integer("max_distance_from_parking"),

  // Campo aberto para necessidades nao cobertas
  otherNeeds: text("other_needs"),

  ...timestamps,
});

// --- Relacoes ---

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

export const userAccessibilityProfilesRelations = relations(
  userAccessibilityProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [userAccessibilityProfiles.userId],
      references: [users.id],
    }),
  }),
);
