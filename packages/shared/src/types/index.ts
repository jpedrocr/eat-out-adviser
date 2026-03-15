// ---------------------------------------------------------------------------
// Tipos partilhados do Eat Out Adviser
// Utilizados por todos os pacotes do monorepo.
// ---------------------------------------------------------------------------

// --- Tipos de enumeracao (union types) ---

/** Tipo de mobilidade do utilizador. */
export type MobilityType =
  | "electric_wheelchair"
  | "manual_wheelchair"
  | "walker"
  | "crutches"
  | "cane"
  | "scooter"
  | "none"
  | "other";

/** Faixa de preco do restaurante. */
export type PriceRange = "budget" | "moderate" | "upscale" | "fine_dining";

/** Estado de verificacao dos dados de acessibilidade. */
export type VerificationStatus = "unverified" | "community_verified" | "professionally_verified";

/** Origem dos dados de acessibilidade. */
export type DataSource = "owner" | "community" | "import" | "ai_analysis";

/** Papel do utilizador na plataforma. */
export type UserRole = "user" | "owner" | "verifier" | "admin";

/** Estado do restaurante no ciclo de vida da plataforma. */
export type RestaurantStatus = "pending" | "active" | "inactive" | "archived";

/** Tipo de porta da entrada. */
export type EntranceType =
  | "automatic"
  | "manual_push"
  | "manual_pull"
  | "revolving"
  | "sliding"
  | "open";

/** Tipo de superficie exterior (percurso ate a entrada). */
export type SurfaceType = "smooth" | "cobblestone" | "gravel" | "uneven" | "grass";

/** Tipo de pavimento interior. */
export type FloorType = "smooth_tile" | "carpet" | "wood" | "concrete" | "uneven" | "other";

/** Nivel de iluminacao. */
export type LightingLevel = "well_lit" | "moderate" | "poor";

/** Lado das barras de apoio na casa de banho. */
export type GrabBarSide = "left" | "right" | "both";

/** Tipo de torneira do lavatorio. */
export type FaucetType = "lever" | "sensor" | "knob";

/** Lado de transferencia da cadeira para a sanita. */
export type BathroomTransferSide = "left" | "right" | "both" | "not_applicable";

/** Idioma suportado pela plataforma. */
export type Locale = "pt" | "en";

/** Texto multilingue indexado por idioma. */
export type MultilingualText = Record<Locale, string>;

/** Classificacao semaforo para comunicacao rapida de acessibilidade. */
export type TrafficLightRating = "green" | "yellow" | "red";

/** Estado da avaliacao no fluxo de moderacao. */
export type ReviewStatus = "pending" | "published" | "flagged" | "removed";

// --- Interfaces de entidades ---

/** Restaurante — entidade central de negocio. */
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: MultilingualText | null;
  address: string;
  city: string;
  postalCode: string;
  district: string | null;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  cuisineTypes: string[] | null;
  priceRange: PriceRange | null;
  openingHours: Record<string, { open: string; close: string }[]> | null;
  capacity: number | null;
  isClaimedByOwner: boolean;
  ownerId: string | null;
  status: RestaurantStatus;
  averageFoodRating: number | null;
  averageServiceRating: number | null;
  averageAccessibilityScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Utilizador registado na plataforma. */
export interface User {
  id: string;
  email: string;
  name: string;
  locale: Locale;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Perfil de acessibilidade pessoal do utilizador (dimensoes do equipamento, capacidades). */
export interface UserAccessibilityProfile {
  id: string;
  userId: string;
  mobilityType: MobilityType;
  wheelchairWidth: number | null;
  wheelchairLength: number | null;
  turningRadiusNeeded: number | null;
  maxRampIncline: number | null;
  maxStepHeight: number | null;
  needsElevator: boolean;
  needsAccessibleBathroom: boolean;
  bathroomTransferSide: BathroomTransferSide;
  doorOpeningForceLimit: number | null;
  companionCount: number | null;
  dietaryRestrictions: string[] | null;
  allergies: string[] | null;
  preferredCuisines: string[] | null;
  maxDistanceFromParking: number | null;
  otherNeeds: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Perfil de acessibilidade fisica de um restaurante (dados factuais verificaveis). */
export interface AccessibilityProfile {
  id: string;
  restaurantId: string;

  // Entrada e exterior
  hasAccessibleEntrance: boolean | null;
  entranceDoorWidth: number | null;
  entranceType: EntranceType | null;
  hasLevelEntrance: boolean | null;
  hasRamp: boolean | null;
  rampIncline: number | null;
  rampHasHandrails: boolean | null;
  numberOfSteps: number | null;
  stepHeight: number | null;
  hasPortableRamp: boolean | null;
  hasDoorbell: boolean | null;
  doorbellHeight: number | null;
  doorbellIsAccessible: boolean | null;
  exteriorSurfaceType: SurfaceType | null;
  entranceLighting: LightingLevel | null;
  entranceNotes: string | null;

  // Estacionamento
  hasAccessibleParking: boolean | null;
  accessibleParkingSpaces: number | null;
  parkingDistanceToEntrance: number | null;
  parkingSpaceWidth: number | null;
  hasAdjacentAccessAisle: boolean | null;
  accessAisleWidth: number | null;
  hasDropoffArea: boolean | null;
  parkingNotes: string | null;

  // Interior e circulacao
  corridorMinWidth: number | null;
  hasElevator: boolean | null;
  elevatorDoorWidth: number | null;
  elevatorCabinWidth: number | null;
  elevatorCabinDepth: number | null;
  elevatorHasAccessibleControls: boolean | null;
  floorType: FloorType | null;
  isNonSlip: boolean | null;
  hasInteriorSteps: boolean | null;
  interiorStepCount: number | null;
  turningSpaceAvailable: number | null;
  counterHeight: number | null;
  hasLowCounter: boolean | null;
  interiorNotes: string | null;

  // Mesas e assentos
  hasAccessibleTables: boolean | null;
  accessibleTableCount: number | null;
  tableHeight: number | null;
  underTableClearance: number | null;
  spaceBetweenTables: number | null;
  hasOutdoorSeating: boolean | null;
  outdoorSeatingAccessible: boolean | null;
  seatingNotes: string | null;

  // Casa de banho
  hasAccessibleBathroom: boolean | null;
  bathroomDoorWidth: number | null;
  bathroomTurningSpace: number | null;
  hasGrabBars: boolean | null;
  grabBarSide: GrabBarSide | null;
  toiletSeatHeight: number | null;
  sinkHeight: number | null;
  hasKneeSpaceUnderSink: boolean | null;
  faucetType: FaucetType | null;
  hasMirrorAtWheelchairHeight: boolean | null;
  hasEmergencyButton: boolean | null;
  bathroomOnSameFloor: boolean | null;
  bathroomNotes: string | null;

  // Comunicacao e ementa
  hasBrailleMenu: boolean | null;
  hasLargePrintMenu: boolean | null;
  hasDigitalMenu: boolean | null;
  hasQRCodeMenu: boolean | null;
  hasPictureMenu: boolean | null;
  staffTrainedInAccessibility: boolean | null;
  hasHearingLoop: boolean | null;
  menuNotes: string | null;

  // Metadados de verificacao
  verificationStatus: VerificationStatus;
  lastVerifiedAt: Date | null;
  verifiedById: string | null;
  dataSource: DataSource;
  confidenceScore: number | null;
  lastUpdatedById: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/** Avaliacao de um restaurante por um utilizador. */
export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  foodRating: number;
  serviceRating: number;
  accessibilityRating: number;
  overallRating: number;
  text: string | null;
  visitDate: string | null;
  mobilityTypeAtVisit: MobilityType | null;
  companionCount: number | null;
  helpfulCount: number;
  status: ReviewStatus;
  aiSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Pontuacao de acessibilidade calculada para um restaurante. */
export interface AccessibilityScore {
  id: string;
  restaurantId: string;
  overallScore: number;
  entranceScore: number | null;
  parkingScore: number | null;
  interiorScore: number | null;
  seatingScore: number | null;
  bathroomScore: number | null;
  communicationScore: number | null;
  weightedScoreForProfile: Record<MobilityType, number> | null;
  calculatedAt: Date;
}

/** Categoria de acessibilidade com peso para o calculo da pontuacao. */
export interface AccessibilityCategory {
  key: string;
  labelPt: string;
  labelEn: string;
  weight: number;
}
