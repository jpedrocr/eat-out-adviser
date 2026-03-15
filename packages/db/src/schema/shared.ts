import { pgEnum, timestamp } from "drizzle-orm/pg-core";

// --- Enums partilhados ---

/** Tipo de mobilidade do utilizador */
export const mobilityTypeEnum = pgEnum("mobility_type", [
  "electric_wheelchair",
  "manual_wheelchair",
  "walker",
  "crutches",
  "cane",
  "scooter",
  "none",
  "other",
]);

/** Faixa de preco do restaurante */
export const priceRangeEnum = pgEnum("price_range", [
  "budget",
  "moderate",
  "upscale",
  "fine_dining",
]);

/** Estado de verificacao do perfil de acessibilidade */
export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "community_verified",
  "professionally_verified",
]);

/** Origem dos dados de acessibilidade */
export const dataSourceEnum = pgEnum("data_source", [
  "owner",
  "community",
  "import",
  "ai_analysis",
]);

/** Estado do restaurante no sistema */
export const restaurantStatusEnum = pgEnum("restaurant_status", [
  "pending",
  "active",
  "inactive",
  "archived",
]);

/** Tipo de porta de entrada */
export const entranceTypeEnum = pgEnum("entrance_type", [
  "automatic",
  "manual_push",
  "manual_pull",
  "revolving",
  "sliding",
  "open",
]);

/** Tipo de superficie exterior */
export const surfaceTypeEnum = pgEnum("surface_type", [
  "smooth",
  "cobblestone",
  "gravel",
  "uneven",
  "grass",
]);

/** Tipo de pavimento interior */
export const floorTypeEnum = pgEnum("floor_type", [
  "smooth_tile",
  "carpet",
  "wood",
  "concrete",
  "uneven",
  "other",
]);

/** Nivel de iluminacao */
export const lightingLevelEnum = pgEnum("lighting_level", ["well_lit", "moderate", "poor"]);

/** Lado das barras de apoio na casa de banho */
export const grabBarSideEnum = pgEnum("grab_bar_side", ["left", "right", "both"]);

/** Tipo de torneira na casa de banho */
export const faucetTypeEnum = pgEnum("faucet_type", ["lever", "sensor", "knob"]);

/** Lado de transferencia na casa de banho (para utilizadores de cadeira de rodas) */
export const bathroomTransferSideEnum = pgEnum("bathroom_transfer_side", [
  "left",
  "right",
  "both",
  "not_applicable",
]);

/** Tipo de superficie do estacionamento */
export const parkingSurfaceTypeEnum = pgEnum("parking_surface_type", [
  "asphalt",
  "concrete",
  "cobblestone",
  "gravel",
  "other",
]);

// --- Campos comuns (timestamps) ---
// Utilizados via spread em todas as tabelas

/** Campos de timestamp partilhados: created_at e updated_at com timezone */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
