// ---------------------------------------------------------------------------
// Esquemas Zod partilhados do Eat Out Adviser
// ---------------------------------------------------------------------------

import { z } from "zod";

// --- Coordenadas geograficas ---

/** Esquema para coordenadas (latitude/longitude). */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

// --- Paginacao ---

/** Esquema para parametros de paginacao com valores por defeito. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

// --- Pesquisa ---

/** Esquema para consultas de pesquisa com filtros opcionais. */
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  filters: z
    .object({
      city: z.string().optional(),
      district: z.string().optional(),
      cuisineTypes: z.array(z.string()).optional(),
      priceRange: z.enum(["budget", "moderate", "upscale", "fine_dining"]).optional(),
      minAccessibilityScore: z.number().min(0).max(100).optional(),
      mobilityType: z
        .enum([
          "electric_wheelchair",
          "manual_wheelchair",
          "walker",
          "crutches",
          "cane",
          "scooter",
          "none",
          "other",
        ])
        .optional(),
      maxDistance: z.number().positive().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// --- Perfil do utilizador ---

/** Esquema para dados basicos do perfil de utilizador. */
export const userProfileSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  locale: z.enum(["pt", "en"]).default("pt"),
  avatarUrl: z.string().url().nullable().optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

// --- Dados de acessibilidade do restaurante ---

/** Esquema para submissao de dados de acessibilidade de um restaurante. */
export const accessibilityProfileInputSchema = z.object({
  // Entrada e exterior
  hasAccessibleEntrance: z.boolean().optional(),
  entranceDoorWidth: z.number().positive().optional(),
  entranceType: z
    .enum(["automatic", "manual_push", "manual_pull", "revolving", "sliding", "open"])
    .optional(),
  hasLevelEntrance: z.boolean().optional(),
  hasRamp: z.boolean().optional(),
  rampIncline: z.number().min(0).max(100).optional(),
  rampHasHandrails: z.boolean().optional(),
  numberOfSteps: z.number().int().min(0).optional(),
  stepHeight: z.number().min(0).optional(),
  hasPortableRamp: z.boolean().optional(),
  hasDoorbell: z.boolean().optional(),
  doorbellHeight: z.number().positive().optional(),
  doorbellIsAccessible: z.boolean().optional(),
  exteriorSurfaceType: z.enum(["smooth", "cobblestone", "gravel", "uneven", "grass"]).optional(),
  entranceLighting: z.enum(["well_lit", "moderate", "poor"]).optional(),
  entranceNotes: z.string().max(2000).optional(),

  // Estacionamento
  hasAccessibleParking: z.boolean().optional(),
  accessibleParkingSpaces: z.number().int().min(0).optional(),
  parkingDistanceToEntrance: z.number().int().min(0).optional(),
  parkingSpaceWidth: z.number().positive().optional(),
  hasAdjacentAccessAisle: z.boolean().optional(),
  accessAisleWidth: z.number().positive().optional(),
  hasDropoffArea: z.boolean().optional(),
  parkingNotes: z.string().max(2000).optional(),

  // Interior e circulacao
  corridorMinWidth: z.number().positive().optional(),
  hasElevator: z.boolean().optional(),
  elevatorDoorWidth: z.number().positive().optional(),
  elevatorCabinWidth: z.number().positive().optional(),
  elevatorCabinDepth: z.number().positive().optional(),
  elevatorHasAccessibleControls: z.boolean().optional(),
  floorType: z.enum(["smooth_tile", "carpet", "wood", "concrete", "uneven", "other"]).optional(),
  isNonSlip: z.boolean().optional(),
  hasInteriorSteps: z.boolean().optional(),
  interiorStepCount: z.number().int().min(0).optional(),
  turningSpaceAvailable: z.number().positive().optional(),
  counterHeight: z.number().positive().optional(),
  hasLowCounter: z.boolean().optional(),
  interiorNotes: z.string().max(2000).optional(),

  // Mesas e assentos
  hasAccessibleTables: z.boolean().optional(),
  accessibleTableCount: z.number().int().min(0).optional(),
  tableHeight: z.number().positive().optional(),
  underTableClearance: z.number().positive().optional(),
  spaceBetweenTables: z.number().positive().optional(),
  hasOutdoorSeating: z.boolean().optional(),
  outdoorSeatingAccessible: z.boolean().optional(),
  seatingNotes: z.string().max(2000).optional(),

  // Casa de banho
  hasAccessibleBathroom: z.boolean().optional(),
  bathroomDoorWidth: z.number().positive().optional(),
  bathroomTurningSpace: z.number().positive().optional(),
  hasGrabBars: z.boolean().optional(),
  grabBarSide: z.enum(["left", "right", "both"]).optional(),
  toiletSeatHeight: z.number().positive().optional(),
  sinkHeight: z.number().positive().optional(),
  hasKneeSpaceUnderSink: z.boolean().optional(),
  faucetType: z.enum(["lever", "sensor", "knob"]).optional(),
  hasMirrorAtWheelchairHeight: z.boolean().optional(),
  hasEmergencyButton: z.boolean().optional(),
  bathroomOnSameFloor: z.boolean().optional(),
  bathroomNotes: z.string().max(2000).optional(),

  // Comunicacao e ementa
  hasBrailleMenu: z.boolean().optional(),
  hasLargePrintMenu: z.boolean().optional(),
  hasDigitalMenu: z.boolean().optional(),
  hasQRCodeMenu: z.boolean().optional(),
  hasPictureMenu: z.boolean().optional(),
  staffTrainedInAccessibility: z.boolean().optional(),
  hasHearingLoop: z.boolean().optional(),
  menuNotes: z.string().max(2000).optional(),

  // Metadados
  dataSource: z.enum(["owner", "community", "import", "ai_analysis"]).optional(),
});

export type AccessibilityProfileInput = z.infer<typeof accessibilityProfileInputSchema>;
