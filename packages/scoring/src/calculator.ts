// ---------------------------------------------------------------------------
// Motor de calculo de pontuacao de acessibilidade (0-100)
//
// Implementa o algoritmo descrito em ACCESSIBILITY_RATING.md:
//   1. Calculo por subcritrio (interpolacao linear ou tabela)
//   2. Agregacao ponderada por categoria
//   3. Pontuacao global com pesos base ou por tipo de mobilidade
//   4. Pontuacao personalizada com avisos criticos
// ---------------------------------------------------------------------------

import type {
  AccessibilityProfile,
  FaucetType,
  FloorType,
  GrabBarSide,
  LightingLevel,
  MobilityType,
  SurfaceType,
  TrafficLightRating,
  UserAccessibilityProfile,
} from "@eat-out-adviser/shared";

import type { NumericThreshold, RangeThreshold, ThresholdConfig } from "./thresholds.js";
import { isRangeThreshold } from "./thresholds.js";
import type { CategoryKey, WeightMap } from "./weights.js";
import { CATEGORY_KEYS, getWeightsForMobilityType } from "./weights.js";

// ---------------------------------------------------------------------------
// Tipos de resultado
// ---------------------------------------------------------------------------

/** Resultado do calculo de um subcritrio individual. */
export interface SubcriterionResult {
  /** Identificador do subcritrio. */
  readonly key: string;
  /** Pontuacao calculada (0-100). */
  readonly score: number;
  /** Valor original utilizado no calculo. */
  readonly rawValue: number | boolean | string | null;
  /** Peso do subcritrio dentro da categoria. */
  readonly weight: number;
}

/** Resultado do calculo de uma categoria. */
export interface CategoryResult {
  /** Chave da categoria. */
  readonly category: CategoryKey;
  /** Pontuacao ponderada da categoria (0-100). */
  readonly score: number;
  /** Classificacao semaforo da categoria. */
  readonly trafficLight: TrafficLightRating;
  /** Detalhes de cada subcritrio. */
  readonly subcriteria: readonly SubcriterionResult[];
}

/** Etiqueta descritiva da pontuacao. */
export type ScoreLabel = "Excelente" | "Bom" | "Razoavel" | "Limitado" | "Inacessivel";

/** Resultado da pontuacao global. */
export interface GlobalScoreResult {
  /** Pontuacao global (0-100). */
  readonly score: number;
  /** Classificacao semaforo global. */
  readonly trafficLight: TrafficLightRating;
  /** Etiqueta descritiva em portugues. */
  readonly label: ScoreLabel;
  /** Resultados por categoria. */
  readonly categories: Record<CategoryKey, CategoryResult>;
  /** Pesos utilizados no calculo. */
  readonly weights: WeightMap;
}

/** Aviso critico sobre barreira fisica intransponivel. */
export interface CriticalWarning {
  /** Categoria onde se encontra a barreira. */
  readonly category: CategoryKey;
  /** Mensagem descritiva em portugues. */
  readonly message: string;
  /** Valor medido no restaurante. */
  readonly measured: number | null;
  /** Limite do utilizador que e violado. */
  readonly userLimit: number | null;
}

/** Resultado da pontuacao personalizada. */
export interface PersonalizedScoreResult extends GlobalScoreResult {
  /** Tipo de mobilidade utilizado no calculo. */
  readonly mobilityType: MobilityType;
  /** Avisos criticos sobre barreiras intransponiveis. */
  readonly criticalWarnings: readonly CriticalWarning[];
  /** Se true, existem barreiras que impedem o acesso. */
  readonly hasCriticalBarriers: boolean;
}

// ---------------------------------------------------------------------------
// Funcoes auxiliares de interpolacao
// ---------------------------------------------------------------------------

/**
 * Interpola linearmente uma pontuacao entre dois pontos.
 * Garante que o resultado esta entre 0 e 100.
 */
function lerp(
  value: number,
  fromVal: number,
  toVal: number,
  fromScore: number,
  toScore: number,
): number {
  if (fromVal === toVal) return toScore;
  const t = (value - fromVal) / (toVal - fromVal);
  return Math.max(0, Math.min(100, fromScore + t * (toScore - fromScore)));
}

/**
 * Calcula a pontuacao de um subcritrio numerico com base num limiar.
 * Interpola linearmente entre os pontos definidos.
 *
 * @param value - Valor medido (ou null se desconhecido).
 * @param threshold - Configuracao do limiar.
 * @returns Pontuacao entre 0 e 100.
 */
export function calculateNumericScore(value: number | null, threshold: NumericThreshold): number {
  if (value == null) return 0;

  const { min, acceptable, good, excellent, inverted } = threshold;

  if (inverted) {
    // Valores menores sao melhores (ex: inclinacao de rampa).
    // min = pior (score 0), excellent = melhor (score 100).
    if (value >= min) return 0;
    if (value <= excellent) return 100;
    if (value <= good) return lerp(value, good, excellent, 75, 100);
    if (value <= acceptable) return lerp(value, acceptable, good, 50, 75);
    return lerp(value, min, acceptable, 0, 50);
  }

  // Valores maiores sao melhores (ex: largura de porta).
  if (value <= min) return 0;
  if (value >= excellent) return 100;
  if (value >= good) return lerp(value, good, excellent, 75, 100);
  if (value >= acceptable) return lerp(value, acceptable, good, 50, 75);
  return lerp(value, min, acceptable, 0, 50);
}

/**
 * Calcula a pontuacao de um subcritrio com faixa ideal (ex: altura de sanita).
 *
 * @param value - Valor medido (ou null se desconhecido).
 * @param threshold - Configuracao da faixa.
 * @returns Pontuacao entre 0 e 100.
 */
export function calculateRangeScore(value: number | null, threshold: RangeThreshold): number {
  if (value == null) return 0;

  const { idealMin, idealMax, acceptableMin, acceptableMax, limitMin, limitMax, outsideScore } =
    threshold;

  // Dentro da faixa ideal
  if (value >= idealMin && value <= idealMax) return 100;

  // Abaixo da faixa ideal
  if (value < idealMin) {
    if (value >= acceptableMin) return lerp(value, acceptableMin, idealMin, 50, 100);
    if (value >= limitMin) return lerp(value, limitMin, acceptableMin, 25, 50);
    return outsideScore;
  }

  // Acima da faixa ideal
  if (value <= acceptableMax) return lerp(value, idealMax, acceptableMax, 100, 50);
  if (value <= limitMax) return lerp(value, acceptableMax, limitMax, 50, 25);
  return outsideScore;
}

/**
 * Calcula a pontuacao de um subcritrio generico (numerico, booleano, ou faixa).
 *
 * @param value - Valor medido. null = sem dados = 0.
 * @param threshold - Configuracao do limiar.
 * @returns Pontuacao entre 0 e 100.
 */
export function calculateSubcriterionScore(
  value: number | boolean | null,
  threshold: ThresholdConfig,
): number {
  // Booleanos: 100 se true, 0 se false ou null.
  if (typeof value === "boolean") return value ? 100 : 0;
  if (value == null) return 0;

  if (isRangeThreshold(threshold)) {
    return calculateRangeScore(value, threshold);
  }
  return calculateNumericScore(value, threshold);
}

// ---------------------------------------------------------------------------
// Funcoes de pontuacao por subcritrio (logica de tabela do algoritmo)
// ---------------------------------------------------------------------------

/**
 * Pontuacao da existencia de entrada acessivel.
 * Tabela da seccao 3.1 do ACCESSIBILITY_RATING.md.
 */
function scoreAccessibleEntrance(profile: AccessibilityProfile): number {
  if (profile.hasAccessibleEntrance === true && profile.hasLevelEntrance === true) return 100;
  if (profile.hasAccessibleEntrance === true && profile.hasRamp === true) return 80;
  if (profile.hasAccessibleEntrance === true) return 60;
  if (profile.hasPortableRamp === true) return 40;
  if (profile.hasAccessibleEntrance === false) return 0;
  return 0; // null / desconhecido
}

/**
 * Pontuacao da largura da porta relativamente a uma referencia.
 * Para pontuacao global, ref = 80 cm (ISO 21542).
 * Para pontuacao personalizada, ref = largura da cadeira do utilizador.
 */
function scoreDoorWidth(doorWidth: number | null, refWidth: number): number {
  if (doorWidth == null) return 0;
  const diff = doorWidth - refWidth;
  if (diff >= 15) return 100;
  if (diff >= 5) return lerp(diff, 5, 15, 75, 100);
  if (diff >= 0) return lerp(diff, 0, 5, 50, 75);
  if (diff >= -5) return lerp(diff, -5, 0, 25, 50);
  return 0;
}

/**
 * Pontuacao dos degraus na entrada.
 * Tabela da seccao 3.1.
 */
function scoreSteps(profile: AccessibilityProfile): number {
  const numSteps = profile.numberOfSteps;
  const stepHeight = profile.stepHeight;
  const hasRamp = profile.hasRamp === true;
  const hasPortableRamp = profile.hasPortableRamp === true;

  if (numSteps == null || numSteps === 0) return 100;
  if (numSteps > 0 && hasRamp) return 80;
  if (numSteps === 1 && stepHeight != null && stepHeight <= 2) return 60;
  if (numSteps > 0 && hasPortableRamp) return 40;
  if (numSteps === 1 && stepHeight != null && stepHeight <= 5) return 20;
  if (numSteps === 1) return 5;
  // numSteps >= 2 sem rampa
  return 0;
}

/** Pontuacao do tipo de superficie exterior. */
function scoreSurface(surface: SurfaceType | null): number {
  if (surface == null) return 0;
  const scores: Record<SurfaceType, number> = {
    smooth: 100,
    cobblestone: 30,
    gravel: 20,
    uneven: 15,
    grass: 10,
  };
  return scores[surface] ?? 0;
}

/**
 * Pontuacao da qualidade da rampa.
 * Tabela da seccao 3.1.
 */
function scoreRampQuality(profile: AccessibilityProfile): number {
  // Sem degraus = rampa nao e necessaria
  if (profile.numberOfSteps == null || profile.numberOfSteps === 0) return 100;
  if (profile.hasRamp !== true) return 0;

  const incline = profile.rampIncline;
  const handrails = profile.rampHasHandrails === true;

  if (incline == null) return handrails ? 65 : 50;
  if (incline <= 6) return handrails ? 100 : 85;
  if (incline <= 8) return handrails ? 80 : 65;
  if (incline <= 10) return handrails ? 50 : 35;
  if (incline <= 12) return 20;
  return 5;
}

/** Pontuacao da iluminacao. */
function scoreLighting(level: LightingLevel | null): number {
  if (level == null) return 0;
  const scores: Record<LightingLevel, number> = {
    well_lit: 100,
    moderate: 60,
    poor: 20,
  };
  return scores[level] ?? 0;
}

/** Pontuacao do estacionamento acessivel. */
function scoreAccessibleParking(profile: AccessibilityProfile): number {
  if (profile.accessibleParkingSpaces != null && profile.accessibleParkingSpaces >= 2) return 100;
  if (profile.accessibleParkingSpaces != null && profile.accessibleParkingSpaces >= 1) return 80;
  if (profile.hasAccessibleParking === false) return 30;
  return 0;
}

/** Pontuacao da distancia do estacionamento a entrada. */
function scoreParkingDistance(distance: number | null): number {
  if (distance == null) return 0;
  if (distance <= 20) return 100;
  if (distance <= 50) return lerp(distance, 20, 50, 100, 80);
  if (distance <= 100) return lerp(distance, 50, 100, 80, 50);
  if (distance <= 200) return lerp(distance, 100, 200, 50, 25);
  return 10;
}

/** Pontuacao da largura do lugar de estacionamento. */
function scoreParkingSpaceWidth(width: number | null): number {
  if (width == null) return 0;
  if (width >= 370) return 100;
  if (width >= 330) return lerp(width, 330, 370, 80, 100);
  if (width >= 280) return lerp(width, 280, 330, 60, 80);
  if (width >= 244) return lerp(width, 244, 280, 40, 60);
  return 10;
}

/** Pontuacao do corredor de acesso no estacionamento. */
function scoreAccessAisle(profile: AccessibilityProfile): number {
  if (profile.hasAdjacentAccessAisle !== true) return 0;
  const width = profile.accessAisleWidth;
  if (width == null) return 40;
  if (width >= 152) return 100;
  if (width >= 120) return lerp(width, 120, 152, 70, 100);
  return 40;
}

/** Pontuacao da zona de largada. */
function scoreDropoff(hasDropoff: boolean | null): number {
  return hasDropoff === true ? 100 : 0;
}

/**
 * Pontuacao da largura do corredor.
 * Tabela da seccao 3.3.
 */
function scoreCorridorWidth(width: number | null): number {
  if (width == null) return 0;
  if (width >= 150) return 100;
  if (width >= 120) return lerp(width, 120, 150, 85, 100);
  if (width >= 90) return lerp(width, 90, 120, 65, 85);
  if (width >= 80) return lerp(width, 80, 90, 40, 65);
  if (width >= 70) return lerp(width, 70, 80, 15, 40);
  return 0;
}

/** Pontuacao do tipo de pavimento interior. */
function scoreFloor(floorType: FloorType | null, isNonSlip: boolean | null): number {
  if (floorType == null) return 0;

  const baseScores: Record<FloorType, number> = {
    smooth_tile: 80,
    wood: 75,
    concrete: 70,
    carpet: 50,
    uneven: 15,
    other: 40,
  };

  const bonuses: Record<FloorType, number> = {
    smooth_tile: 20,
    wood: 15,
    concrete: 20,
    carpet: 0,
    uneven: 10,
    other: 15,
  };

  const base = baseScores[floorType] ?? 40;
  const bonus = isNonSlip === true ? (bonuses[floorType] ?? 0) : 0;
  return Math.min(100, base + bonus);
}

/**
 * Pontuacao do espaco de rotacao relativamente a uma referencia.
 * Para pontuacao global, ref = 152 cm (ADA 304.3.1).
 */
function scoreTurningSpace(space: number | null, ref: number): number {
  if (space == null) return 0;
  const diff = space - ref;
  if (diff >= 30) return 100;
  if (diff >= 10) return lerp(diff, 10, 30, 85, 100);
  if (diff >= 0) return lerp(diff, 0, 10, 70, 85);
  if (diff >= -10) return lerp(diff, -10, 0, 45, 70);
  if (diff >= -20) return lerp(diff, -20, -10, 25, 45);
  return 0;
}

/** Pontuacao da altura do balcao. */
function scoreCounterHeight(profile: AccessibilityProfile): number {
  const height = profile.counterHeight;
  const hasLow = profile.hasLowCounter === true;

  if (height == null && !hasLow) return 0;
  if (hasLow && height != null && height <= 86) return 100;
  if (hasLow && height != null && height <= 91) return 80;
  if (height != null && height <= 91) return 60;
  if (height != null && height <= 100) return 30;
  if (height != null && height > 100) return 10;
  if (hasLow) return 80; // tem balcao baixo mas sem medida
  return 0;
}

/** Pontuacao dos degraus interiores. */
function scoreInteriorSteps(profile: AccessibilityProfile): number {
  if (profile.hasInteriorSteps === false || profile.hasInteriorSteps == null) return 100;
  const count = profile.interiorStepCount;
  if (count == null) return 30;
  if (count === 1) return 30; // altura tipica desconhecida, assumimos moderado
  if (count >= 2 && profile.hasElevator === true) return 50;
  if (count >= 2) return 0;
  return 30;
}

/**
 * Pontuacao do elevador.
 * So aplicavel se existem degraus interiores.
 */
function scoreElevator(profile: AccessibilityProfile): number {
  // Se nao tem degraus interiores, elevador nao e necessario
  if (profile.hasInteriorSteps !== true) return 100;
  if (profile.hasElevator !== true) return 0;

  const dw = profile.elevatorDoorWidth;
  const cw = profile.elevatorCabinWidth;
  const cd = profile.elevatorCabinDepth;

  if (dw != null && cw != null && cd != null) {
    if (dw >= 91 && cw >= 170 && cd >= 137) return 100;
    if (dw >= 80 && cw >= 140 && cd >= 120) return 70;
    return 40;
  }
  // Tem elevador mas sem dimensoes
  return 60;
}

/** Pontuacao das mesas acessiveis. */
function scoreAccessibleTables(profile: AccessibilityProfile): number {
  if (profile.hasAccessibleTables !== true) return 0;
  const count = profile.accessibleTableCount;
  if (count == null) return 50;
  if (count >= 4) return 100;
  if (count >= 2) return 80;
  return 50;
}

/** Pontuacao da altura da mesa. Faixa ideal: 71-86 cm. */
function scoreTableHeight(height: number | null): number {
  if (height == null) return 0;
  if (height >= 71 && height <= 86) return 100;
  if ((height >= 68 && height < 71) || (height > 86 && height <= 90)) return 70;
  if ((height >= 65 && height < 68) || (height > 90 && height <= 95)) return 40;
  return 10;
}

/** Pontuacao do espaco livre sob a mesa. */
function scoreUnderTableClearance(clearance: number | null): number {
  if (clearance == null) return 0;
  if (clearance >= 73) return 100;
  if (clearance >= 68.5) return lerp(clearance, 68.5, 73, 80, 100);
  if (clearance >= 65) return lerp(clearance, 65, 68.5, 50, 80);
  if (clearance >= 60) return lerp(clearance, 60, 65, 25, 50);
  return 0;
}

/** Pontuacao do espaco entre mesas. */
function scoreTableSpacing(spacing: number | null): number {
  if (spacing == null) return 0;
  if (spacing >= 120) return 100;
  if (spacing >= 90) return lerp(spacing, 90, 120, 75, 100);
  if (spacing >= 75) return lerp(spacing, 75, 90, 40, 75);
  if (spacing >= 60) return lerp(spacing, 60, 75, 15, 40);
  return 0;
}

/** Pontuacao da esplanada. */
function scoreOutdoor(profile: AccessibilityProfile): number {
  if (profile.hasOutdoorSeating === true && profile.outdoorSeatingAccessible === true) return 100;
  if (profile.hasOutdoorSeating === true && profile.outdoorSeatingAccessible === false) return 30;
  if (profile.hasOutdoorSeating === false) return 50;
  return 50; // null = nao penalizar
}

/** Pontuacao da casa de banho acessivel (booleano). */
function scoreAccessibleBathroom(has: boolean | null): number {
  return has === true ? 100 : 0;
}

/**
 * Pontuacao das barras de apoio.
 * Para pontuacao global: "both" = 100, lado unico = 70, sem = 0.
 */
function scoreGrabBars(
  hasGrabBars: boolean | null,
  side: GrabBarSide | null,
  userTransferSide?: string | null,
): number {
  if (hasGrabBars !== true) return 0;
  if (side === "both") return 100;
  if (userTransferSide && side === userTransferSide) return 90;
  if (userTransferSide && side !== userTransferSide) return 50;
  // Pontuacao global (sem perfil): lado unico = 70
  return 70;
}

/** Pontuacao da altura da sanita. Faixa ideal: 43-48 cm. */
function scoreToiletHeight(height: number | null): number {
  if (height == null) return 0;
  if (height >= 43 && height <= 48) return 100;
  if ((height >= 40 && height < 43) || (height > 48 && height <= 52)) return 70;
  if ((height >= 36 && height < 40) || (height > 52 && height <= 56)) return 40;
  return 10;
}

/**
 * Pontuacao do lavatorio.
 * Composta por: altura (max 40) + espaco para joelhos (max 30) + tipo de torneira (max 30).
 */
function scoreSink(profile: AccessibilityProfile): number {
  let total = 0;

  // Altura
  const h = profile.sinkHeight;
  if (h != null) {
    if (h <= 86) total += 40;
    else if (h <= 91) total += 25;
    else total += 5;
  }

  // Espaco para joelhos
  if (profile.hasKneeSpaceUnderSink === true) total += 30;

  // Torneira
  const faucetScores: Record<FaucetType, number> = {
    sensor: 30,
    lever: 25,
    knob: 10,
  };
  if (profile.faucetType != null) {
    total += faucetScores[profile.faucetType] ?? 0;
  }

  return Math.min(100, total);
}

/** Pontuacao da casa de banho no mesmo piso. */
function scoreSameFloor(profile: AccessibilityProfile): number {
  if (profile.bathroomOnSameFloor === true) return 100;
  if (profile.bathroomOnSameFloor === false && profile.hasElevator === true) return 50;
  if (profile.bathroomOnSameFloor === false) return 0;
  return 0;
}

/** Pontuacao do botao de emergencia. */
function scoreEmergencyButton(has: boolean | null): number {
  return has === true ? 100 : 0;
}

/**
 * Pontuacao dos formatos de ementa acessiveis.
 * Cumulativo, maximo 100.
 */
function scoreMenuFormats(profile: AccessibilityProfile): number {
  let total = 0;
  if (profile.hasDigitalMenu === true || profile.hasQRCodeMenu === true) total += 35;
  if (profile.hasLargePrintMenu === true) total += 25;
  if (profile.hasPictureMenu === true) total += 25;
  if (profile.hasBrailleMenu === true) total += 15;
  return Math.min(100, total);
}

/** Pontuacao da formacao do pessoal. */
function scoreStaffTraining(trained: boolean | null): number {
  return trained === true ? 100 : 0;
}

/** Pontuacao da sinalizacao acessivel (anel de inducao + espelho). */
function scoreSignage(profile: AccessibilityProfile): number {
  let total = 0;
  if (profile.hasHearingLoop === true) total += 50;
  if (profile.hasMirrorAtWheelchairHeight === true) total += 50;
  return total;
}

// ---------------------------------------------------------------------------
// Calculo por categoria
// ---------------------------------------------------------------------------

/** Referencia de largura global para portas: 80 cm (ISO 21542). */
const GLOBAL_DOOR_REF_WIDTH = 80;

/** Referencia de espaco de rotacao global: 152 cm (ADA 304.3.1). */
const GLOBAL_TURNING_REF = 152;

/**
 * Agrega uma lista de subcritrios ponderados numa pontuacao de categoria.
 * Subcritrios com peso > 0 cujos valores sao todos null nao distorcem o calculo.
 */
function aggregateSubcriteria(items: SubcriterionResult[]): number {
  const totalWeight = items.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = items.reduce((sum, s) => sum + s.score * s.weight, 0);
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Calcula a pontuacao da categoria Entrada.
 * Subcritrios e pesos conforme seccao 3.1.
 */
function calculateEntranceScore(
  profile: AccessibilityProfile,
  doorRef: number = GLOBAL_DOOR_REF_WIDTH,
): CategoryResult {
  const subcriteria: SubcriterionResult[] = [
    {
      key: "accessibleEntrance",
      score: scoreAccessibleEntrance(profile),
      rawValue: profile.hasAccessibleEntrance,
      weight: 0.3,
    },
    {
      key: "doorWidth",
      score: scoreDoorWidth(profile.entranceDoorWidth, doorRef),
      rawValue: profile.entranceDoorWidth,
      weight: 0.2,
    },
    {
      key: "steps",
      score: scoreSteps(profile),
      rawValue: profile.numberOfSteps,
      weight: 0.25,
    },
    {
      key: "surface",
      score: scoreSurface(profile.exteriorSurfaceType),
      rawValue: profile.exteriorSurfaceType,
      weight: 0.1,
    },
    {
      key: "rampQuality",
      score: scoreRampQuality(profile),
      rawValue: profile.rampIncline,
      weight: 0.1,
    },
    {
      key: "lighting",
      score: scoreLighting(profile.entranceLighting),
      rawValue: profile.entranceLighting,
      weight: 0.05,
    },
  ];

  const score = aggregateSubcriteria(subcriteria);
  return { category: "entrance", score, trafficLight: getTrafficLight(score), subcriteria };
}

/**
 * Calcula a pontuacao da categoria Estacionamento.
 * Subcritrios e pesos conforme seccao 3.2.
 */
function calculateParkingScore(profile: AccessibilityProfile): CategoryResult {
  const subcriteria: SubcriterionResult[] = [
    {
      key: "accessibleParking",
      score: scoreAccessibleParking(profile),
      rawValue: profile.hasAccessibleParking,
      weight: 0.35,
    },
    {
      key: "distance",
      score: scoreParkingDistance(profile.parkingDistanceToEntrance),
      rawValue: profile.parkingDistanceToEntrance,
      weight: 0.2,
    },
    {
      key: "spaceWidth",
      score: scoreParkingSpaceWidth(profile.parkingSpaceWidth),
      rawValue: profile.parkingSpaceWidth,
      weight: 0.15,
    },
    {
      key: "accessAisle",
      score: scoreAccessAisle(profile),
      rawValue: profile.hasAdjacentAccessAisle,
      weight: 0.15,
    },
    {
      key: "surface",
      score: scoreSurface(profile.exteriorSurfaceType),
      rawValue: profile.exteriorSurfaceType,
      weight: 0.1,
    },
    {
      key: "dropoff",
      score: scoreDropoff(profile.hasDropoffArea),
      rawValue: profile.hasDropoffArea,
      weight: 0.05,
    },
  ];

  const score = aggregateSubcriteria(subcriteria);
  return { category: "parking", score, trafficLight: getTrafficLight(score), subcriteria };
}

/**
 * Calcula a pontuacao da categoria Interior.
 * Subcritrios e pesos conforme seccao 3.3.
 */
function calculateInteriorScore(
  profile: AccessibilityProfile,
  turningRef: number = GLOBAL_TURNING_REF,
): CategoryResult {
  const subcriteria: SubcriterionResult[] = [
    {
      key: "corridorWidth",
      score: scoreCorridorWidth(profile.corridorMinWidth),
      rawValue: profile.corridorMinWidth,
      weight: 0.25,
    },
    {
      key: "floor",
      score: scoreFloor(profile.floorType, profile.isNonSlip),
      rawValue: profile.floorType,
      weight: 0.15,
    },
    {
      key: "turningSpace",
      score: scoreTurningSpace(profile.turningSpaceAvailable, turningRef),
      rawValue: profile.turningSpaceAvailable,
      weight: 0.3,
    },
    {
      key: "counterHeight",
      score: scoreCounterHeight(profile),
      rawValue: profile.counterHeight,
      weight: 0.1,
    },
    {
      key: "interiorSteps",
      score: scoreInteriorSteps(profile),
      rawValue: profile.hasInteriorSteps,
      weight: 0.15,
    },
    {
      key: "elevator",
      score: scoreElevator(profile),
      rawValue: profile.hasElevator,
      weight: 0.05,
    },
  ];

  const score = aggregateSubcriteria(subcriteria);
  return { category: "interior", score, trafficLight: getTrafficLight(score), subcriteria };
}

/**
 * Calcula a pontuacao da categoria Mesas.
 * Subcritrios e pesos conforme seccao 3.4.
 */
function calculateSeatingScore(profile: AccessibilityProfile): CategoryResult {
  const subcriteria: SubcriterionResult[] = [
    {
      key: "accessibleTables",
      score: scoreAccessibleTables(profile),
      rawValue: profile.hasAccessibleTables,
      weight: 0.25,
    },
    {
      key: "tableHeight",
      score: scoreTableHeight(profile.tableHeight),
      rawValue: profile.tableHeight,
      weight: 0.2,
    },
    {
      key: "underTableClearance",
      score: scoreUnderTableClearance(profile.underTableClearance),
      rawValue: profile.underTableClearance,
      weight: 0.25,
    },
    {
      key: "tableSpacing",
      score: scoreTableSpacing(profile.spaceBetweenTables),
      rawValue: profile.spaceBetweenTables,
      weight: 0.2,
    },
    {
      key: "outdoor",
      score: scoreOutdoor(profile),
      rawValue: profile.hasOutdoorSeating,
      weight: 0.1,
    },
  ];

  const score = aggregateSubcriteria(subcriteria);
  return { category: "seating", score, trafficLight: getTrafficLight(score), subcriteria };
}

/**
 * Calcula a pontuacao da categoria Casa de Banho.
 * Subcritrios e pesos conforme seccao 3.5.
 */
function calculateBathroomScore(
  profile: AccessibilityProfile,
  doorRef: number = GLOBAL_DOOR_REF_WIDTH,
  turningRef: number = GLOBAL_TURNING_REF,
  userTransferSide?: string | null,
): CategoryResult {
  const subcriteria: SubcriterionResult[] = [
    {
      key: "accessibleBathroom",
      score: scoreAccessibleBathroom(profile.hasAccessibleBathroom),
      rawValue: profile.hasAccessibleBathroom,
      weight: 0.2,
    },
    {
      key: "bathroomDoorWidth",
      score: scoreDoorWidth(profile.bathroomDoorWidth, doorRef),
      rawValue: profile.bathroomDoorWidth,
      weight: 0.15,
    },
    {
      key: "turningSpace",
      score: scoreTurningSpace(profile.bathroomTurningSpace, turningRef),
      rawValue: profile.bathroomTurningSpace,
      weight: 0.2,
    },
    {
      key: "grabBars",
      score: scoreGrabBars(profile.hasGrabBars, profile.grabBarSide, userTransferSide),
      rawValue: profile.hasGrabBars,
      weight: 0.15,
    },
    {
      key: "toiletHeight",
      score: scoreToiletHeight(profile.toiletSeatHeight),
      rawValue: profile.toiletSeatHeight,
      weight: 0.1,
    },
    {
      key: "sink",
      score: scoreSink(profile),
      rawValue: profile.sinkHeight,
      weight: 0.1,
    },
    {
      key: "sameFloor",
      score: scoreSameFloor(profile),
      rawValue: profile.bathroomOnSameFloor,
      weight: 0.05,
    },
    {
      key: "emergencyButton",
      score: scoreEmergencyButton(profile.hasEmergencyButton),
      rawValue: profile.hasEmergencyButton,
      weight: 0.05,
    },
  ];

  const score = aggregateSubcriteria(subcriteria);
  return { category: "bathroom", score, trafficLight: getTrafficLight(score), subcriteria };
}

/**
 * Calcula a pontuacao da categoria Comunicacao.
 * Subcritrios e pesos conforme seccao 3.6.
 */
function calculateCommunicationScore(profile: AccessibilityProfile): CategoryResult {
  const subcriteria: SubcriterionResult[] = [
    {
      key: "menuFormats",
      score: scoreMenuFormats(profile),
      rawValue: profile.hasDigitalMenu,
      weight: 0.4,
    },
    {
      key: "staffTraining",
      score: scoreStaffTraining(profile.staffTrainedInAccessibility),
      rawValue: profile.staffTrainedInAccessibility,
      weight: 0.35,
    },
    {
      key: "signage",
      score: scoreSignage(profile),
      rawValue: profile.hasHearingLoop,
      weight: 0.25,
    },
  ];

  const score = aggregateSubcriteria(subcriteria);
  return { category: "communication", score, trafficLight: getTrafficLight(score), subcriteria };
}

// ---------------------------------------------------------------------------
// Funcoes de calculo de categoria genericas (por chave)
// ---------------------------------------------------------------------------

/**
 * Calcula a pontuacao de uma categoria pelo seu identificador.
 *
 * @param profile - Perfil de acessibilidade do restaurante.
 * @param category - Chave da categoria.
 * @param doorRef - Largura de referencia para portas (cm). Defeito: 80 cm.
 * @param turningRef - Espaco de rotacao de referencia (cm). Defeito: 152 cm.
 * @param userTransferSide - Lado de transferencia do utilizador (para barras de apoio).
 * @returns Resultado da categoria.
 */
export function calculateCategoryScore(
  profile: AccessibilityProfile,
  category: CategoryKey,
  doorRef: number = GLOBAL_DOOR_REF_WIDTH,
  turningRef: number = GLOBAL_TURNING_REF,
  userTransferSide?: string | null,
): CategoryResult {
  switch (category) {
    case "entrance":
      return calculateEntranceScore(profile, doorRef);
    case "parking":
      return calculateParkingScore(profile);
    case "interior":
      return calculateInteriorScore(profile, turningRef);
    case "seating":
      return calculateSeatingScore(profile);
    case "bathroom":
      return calculateBathroomScore(profile, doorRef, turningRef, userTransferSide);
    case "communication":
      return calculateCommunicationScore(profile);
  }
}

// ---------------------------------------------------------------------------
// Classificacao semaforo e etiqueta
// ---------------------------------------------------------------------------

/**
 * Determina a classificacao semaforo a partir de uma pontuacao.
 * Verde >= 70, Amarelo >= 40, Vermelho < 40.
 */
export function getTrafficLight(score: number): TrafficLightRating {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

/**
 * Determina a etiqueta descritiva em portugues a partir de uma pontuacao.
 * Excelente >= 90, Bom >= 70, Razoavel >= 50, Limitado >= 30, Inacessivel < 30.
 */
export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 90) return "Excelente";
  if (score >= 70) return "Bom";
  if (score >= 50) return "Razoavel";
  if (score >= 30) return "Limitado";
  return "Inacessivel";
}

// ---------------------------------------------------------------------------
// Pontuacao global
// ---------------------------------------------------------------------------

/**
 * Calcula a pontuacao global de acessibilidade de um restaurante.
 *
 * Agrega as 6 categorias com pesos base ou ajustados ao tipo de mobilidade.
 * Nao aplica criterios eliminatorios nem avisos criticos (ver `calculatePersonalizedScore`).
 *
 * @param profile - Perfil de acessibilidade do restaurante.
 * @param mobilityType - Tipo de mobilidade para ajustar pesos. Opcional.
 * @returns Resultado global com pontuacao, semaforo, etiqueta e detalhes por categoria.
 */
export function calculateGlobalScore(
  profile: AccessibilityProfile,
  mobilityType?: MobilityType,
): GlobalScoreResult {
  const weights = getWeightsForMobilityType(mobilityType);

  const categories = {} as Record<CategoryKey, CategoryResult>;
  for (const key of CATEGORY_KEYS) {
    categories[key] = calculateCategoryScore(profile, key);
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of CATEGORY_KEYS) {
    const w = weights[key];
    const cat = categories[key];
    if (cat) {
      weightedSum += cat.score * w;
      totalWeight += w;
    }
  }

  const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;

  return {
    score,
    trafficLight: getTrafficLight(score),
    label: getScoreLabel(score),
    categories,
    weights,
  };
}

// ---------------------------------------------------------------------------
// Criterios eliminatorios e avisos criticos
// ---------------------------------------------------------------------------

/**
 * Verifica criterios eliminatorios e gera avisos criticos.
 * Conforme seccao 4.3 do ACCESSIBILITY_RATING.md.
 *
 * @param profile - Perfil de acessibilidade do restaurante.
 * @param userProfile - Perfil de acessibilidade do utilizador.
 * @returns Lista de avisos criticos.
 */
function checkCriticalBarriers(
  profile: AccessibilityProfile,
  userProfile: UserAccessibilityProfile,
): CriticalWarning[] {
  const warnings: CriticalWarning[] = [];

  // Porta da entrada demasiado estreita (margem de 4 cm)
  if (
    profile.entranceDoorWidth != null &&
    userProfile.wheelchairWidth != null &&
    profile.entranceDoorWidth < userProfile.wheelchairWidth + 4
  ) {
    warnings.push({
      category: "entrance",
      message: "Porta da entrada demasiado estreita para a sua cadeira",
      measured: profile.entranceDoorWidth,
      userLimit: userProfile.wheelchairWidth + 4,
    });
  }

  // Degraus sem rampa e utilizador nao consegue superar degraus
  if (
    profile.numberOfSteps != null &&
    profile.numberOfSteps > 0 &&
    profile.hasRamp !== true &&
    profile.hasPortableRamp !== true &&
    userProfile.maxStepHeight != null &&
    userProfile.maxStepHeight === 0
  ) {
    warnings.push({
      category: "entrance",
      message: "Sem acesso ao nivel \u2014 degraus sem rampa",
      measured: profile.numberOfSteps,
      userLimit: 0,
    });
  }

  // Inclinacao da rampa superior ao limite do utilizador
  if (
    profile.rampIncline != null &&
    userProfile.maxRampIncline != null &&
    profile.rampIncline > userProfile.maxRampIncline
  ) {
    warnings.push({
      category: "entrance",
      message: "Inclinacao da rampa superior ao seu limite",
      measured: profile.rampIncline,
      userLimit: userProfile.maxRampIncline,
    });
  }

  // Porta da casa de banho demasiado estreita
  if (
    profile.bathroomDoorWidth != null &&
    userProfile.wheelchairWidth != null &&
    profile.bathroomDoorWidth < userProfile.wheelchairWidth + 4
  ) {
    warnings.push({
      category: "bathroom",
      message: "Porta da casa de banho demasiado estreita",
      measured: profile.bathroomDoorWidth,
      userLimit: userProfile.wheelchairWidth + 4,
    });
  }

  // Espaco de rotacao na casa de banho insuficiente
  if (
    profile.bathroomTurningSpace != null &&
    userProfile.turningRadiusNeeded != null &&
    profile.bathroomTurningSpace < userProfile.turningRadiusNeeded - 20
  ) {
    warnings.push({
      category: "bathroom",
      message: "Espaco de rotacao na casa de banho insuficiente",
      measured: profile.bathroomTurningSpace,
      userLimit: userProfile.turningRadiusNeeded - 20,
    });
  }

  // Corredores demasiado estreitos
  if (
    profile.corridorMinWidth != null &&
    userProfile.wheelchairWidth != null &&
    profile.corridorMinWidth < userProfile.wheelchairWidth + 10
  ) {
    warnings.push({
      category: "interior",
      message: "Corredores demasiado estreitos",
      measured: profile.corridorMinWidth,
      userLimit: userProfile.wheelchairWidth + 10,
    });
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Pontuacao personalizada
// ---------------------------------------------------------------------------

/**
 * Calcula a pontuacao personalizada de acessibilidade para um utilizador especifico.
 *
 * Difere da pontuacao global em tres aspetos:
 * 1. Usa as dimensoes do equipamento do utilizador como referencia (largura da cadeira,
 *    raio de viragem) em vez de limiares normativos globais.
 * 2. Aplica pesos ajustados ao tipo de mobilidade.
 * 3. Verifica criterios eliminatorios e gera avisos criticos.
 *
 * @param profile - Perfil de acessibilidade do restaurante.
 * @param userProfile - Perfil de acessibilidade do utilizador.
 * @returns Resultado personalizado com pontuacao, avisos criticos e detalhes.
 */
export function calculatePersonalizedScore(
  profile: AccessibilityProfile,
  userProfile: UserAccessibilityProfile,
): PersonalizedScoreResult {
  const mobilityType = userProfile.mobilityType;
  const weights = getWeightsForMobilityType(mobilityType);

  // Referencia de largura de porta: cadeira do utilizador ou defeito global
  const doorRef = userProfile.wheelchairWidth ?? GLOBAL_DOOR_REF_WIDTH;

  // Referencia de espaco de rotacao: necessidade do utilizador ou defeito global
  const turningRef = userProfile.turningRadiusNeeded ?? GLOBAL_TURNING_REF;

  // Lado de transferencia para barras de apoio
  const transferSide =
    userProfile.bathroomTransferSide !== "not_applicable" ? userProfile.bathroomTransferSide : null;

  // Calcular cada categoria com referencias personalizadas
  const categories = {} as Record<CategoryKey, CategoryResult>;
  for (const key of CATEGORY_KEYS) {
    categories[key] = calculateCategoryScore(profile, key, doorRef, turningRef, transferSide);
  }

  // Pontuacao global ponderada
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of CATEGORY_KEYS) {
    const w = weights[key];
    const cat = categories[key];
    if (cat) {
      weightedSum += cat.score * w;
      totalWeight += w;
    }
  }

  const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;

  // Verificar criterios eliminatorios
  const criticalWarnings = checkCriticalBarriers(profile, userProfile);

  return {
    score,
    trafficLight: getTrafficLight(score),
    label: getScoreLabel(score),
    categories,
    weights,
    mobilityType,
    criticalWarnings,
    hasCriticalBarriers: criticalWarnings.length > 0,
  };
}
