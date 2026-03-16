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

import { restaurants } from "./restaurant";
import {
  dataSourceEnum,
  entranceTypeEnum,
  faucetTypeEnum,
  floorTypeEnum,
  grabBarSideEnum,
  lightingLevelEnum,
  parkingSurfaceTypeEnum,
  surfaceTypeEnum,
  timestamps,
  verificationStatusEnum,
} from "./shared";
import { users } from "./user";

// --- Tabela: accessibility_profiles ---

/**
 * Perfil de acessibilidade do restaurante (relacao 1:1 com restaurants).
 * Entidade nuclear do sistema, com campos derivados das normas ADA, ISO 21542 e EAA.
 */
export const accessibilityProfiles = pgTable("accessibility_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // ============================================
  // ENTRADA E EXTERIOR
  // ============================================

  hasAccessibleEntrance: boolean("has_accessible_entrance"),
  entranceDoorWidth: real("entrance_door_width"),
  entranceType: entranceTypeEnum("entrance_type"),
  hasLevelEntrance: boolean("has_level_entrance"),

  // Rampa
  hasRamp: boolean("has_ramp"),
  rampIncline: real("ramp_incline"),
  rampHasHandrails: boolean("ramp_has_handrails"),

  // Degraus
  numberOfSteps: integer("number_of_steps"),
  stepHeight: real("step_height"),

  // Rampa portatil
  hasPortableRamp: boolean("has_portable_ramp"),

  // Campainha / intercomunicador
  hasDoorbell: boolean("has_doorbell"),
  doorbellHeight: real("doorbell_height"),
  doorbellIsAccessible: boolean("doorbell_is_accessible"),

  // Superficie exterior
  exteriorSurfaceType: surfaceTypeEnum("exterior_surface_type"),

  // Iluminacao da entrada
  entranceLighting: lightingLevelEnum("entrance_lighting"),

  entranceNotes: text("entrance_notes"),

  // ============================================
  // ESTACIONAMENTO
  // ============================================

  hasAccessibleParking: boolean("has_accessible_parking"),
  accessibleParkingSpaces: integer("accessible_parking_spaces"),
  parkingDistanceToEntrance: integer("parking_distance_to_entrance"),
  parkingSpaceWidth: real("parking_space_width"),
  hasAdjacentAccessAisle: boolean("has_adjacent_access_aisle"),
  accessAisleWidth: real("access_aisle_width"),
  parkingSurfaceType: parkingSurfaceTypeEnum("parking_surface_type"),
  hasDropoffArea: boolean("has_dropoff_area"),
  parkingNotes: text("parking_notes"),

  // ============================================
  // INTERIOR E CIRCULACAO
  // ============================================

  corridorMinWidth: real("corridor_min_width"),

  // Elevador
  hasElevator: boolean("has_elevator"),
  elevatorDoorWidth: real("elevator_door_width"),
  elevatorCabinWidth: real("elevator_cabin_width"),
  elevatorCabinDepth: real("elevator_cabin_depth"),
  elevatorHasAccessibleControls: boolean("elevator_has_accessible_controls"),

  // Piso
  floorType: floorTypeEnum("floor_type"),
  isNonSlip: boolean("is_non_slip"),

  // Degraus interiores
  hasInteriorSteps: boolean("has_interior_steps"),
  interiorStepCount: integer("interior_step_count"),

  // Espaco de manobra
  turningSpaceAvailable: real("turning_space_available"),

  // Balcao
  counterHeight: real("counter_height"),
  hasLowCounter: boolean("has_low_counter"),

  interiorNotes: text("interior_notes"),

  // ============================================
  // MESAS E ASSENTOS
  // ============================================

  hasAccessibleTables: boolean("has_accessible_tables"),
  accessibleTableCount: integer("accessible_table_count"),
  tableHeight: real("table_height"),
  underTableClearance: real("under_table_clearance"),
  spaceBetweenTables: real("space_between_tables"),

  // Esplanada
  hasOutdoorSeating: boolean("has_outdoor_seating"),
  outdoorSeatingAccessible: boolean("outdoor_seating_accessible"),

  seatingNotes: text("seating_notes"),

  // ============================================
  // CASA DE BANHO
  // ============================================

  hasAccessibleBathroom: boolean("has_accessible_bathroom"),
  bathroomDoorWidth: real("bathroom_door_width"),
  bathroomTurningSpace: real("bathroom_turning_space"),

  // Barras de apoio
  hasGrabBars: boolean("has_grab_bars"),
  grabBarSide: grabBarSideEnum("grab_bar_side"),

  // Sanita
  toiletSeatHeight: real("toilet_seat_height"),

  // Lavatorio
  sinkHeight: real("sink_height"),
  hasKneeSpaceUnderSink: boolean("has_knee_space_under_sink"),
  faucetType: faucetTypeEnum("faucet_type"),

  // Outros elementos da casa de banho
  hasMirrorAtWheelchairHeight: boolean("has_mirror_at_wheelchair_height"),
  hasEmergencyButton: boolean("has_emergency_button"),
  bathroomOnSameFloor: boolean("bathroom_on_same_floor"),

  bathroomNotes: text("bathroom_notes"),

  // ============================================
  // COMUNICACAO E EMENTA
  // ============================================

  hasBrailleMenu: boolean("has_braille_menu"),
  hasLargeTextMenu: boolean("has_large_text_menu"),
  hasDigitalMenu: boolean("has_digital_menu"),
  hasAudioDescription: boolean("has_audio_description"),
  staffAccessibilityTraining: boolean("staff_accessibility_training"),
  hasAccessibleSignage: boolean("has_accessible_signage"),
  communicationNotes: text("communication_notes"),

  // ============================================
  // METADADOS DE VERIFICACAO
  // ============================================

  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  lastVerifiedBy: uuid("last_verified_by").references(() => users.id, { onDelete: "set null" }),
  dataSource: dataSourceEnum("data_source").notNull().default("community"),
  dataConfidenceScore: integer("data_confidence_score"),

  ...timestamps,
});

// --- Tabela: accessibility_scores ---

/** Pontuacoes de acessibilidade calculadas por categoria (cache, recalculadas quando o perfil muda) */
export const accessibilityScores = pgTable("accessibility_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Score global (0-100)
  globalScore: real("global_score").notNull(),

  // Scores por categoria (0-100)
  entranceScore: real("entrance_score"),
  parkingScore: real("parking_score"),
  interiorScore: real("interior_score"),
  seatingScore: real("seating_score"),
  bathroomScore: real("bathroom_score"),
  communicationScore: real("communication_score"),

  // Semaforo de acessibilidade
  trafficLight: varchar("traffic_light", { length: 10 }),

  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),

  ...timestamps,
});

// --- Relacoes ---

export const accessibilityProfilesRelations = relations(accessibilityProfiles, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [accessibilityProfiles.restaurantId],
    references: [restaurants.id],
  }),
  verifiedBy: one(users, {
    fields: [accessibilityProfiles.lastVerifiedBy],
    references: [users.id],
  }),
}));

export const accessibilityScoresRelations = relations(accessibilityScores, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [accessibilityScores.restaurantId],
    references: [restaurants.id],
  }),
}));
