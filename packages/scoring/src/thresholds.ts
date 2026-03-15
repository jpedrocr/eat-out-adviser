// ---------------------------------------------------------------------------
// Limiares de pontuacao para subcritrios de acessibilidade
//
// Cada limiar define pontos de interpolacao entre 0 e 100.
// Os valores baseiam-se em normas internacionais:
//   - DL 163/2006 (Portugal)
//   - ADA (Americans with Disabilities Act)
//   - ISO 21542:2021
//   - UK Building Regulations Part M
// ---------------------------------------------------------------------------

/**
 * Configuracao de limiar para um subcritrio numerico.
 * A pontuacao e interpolada linearmente entre os pontos definidos.
 *
 * - `min`: valor que pontua 0 (completamente inacessivel)
 * - `acceptable`: valor que pontua 50 (cumpre minimo legal)
 * - `good`: valor que pontua 75 (confortavel)
 * - `excellent`: valor que pontua 100 (ideal)
 * - `inverted`: se true, valores menores sao melhores (ex: inclinacao de rampa)
 */
export interface NumericThreshold {
  readonly min: number;
  readonly acceptable: number;
  readonly good: number;
  readonly excellent: number;
  readonly inverted?: boolean;
}

/**
 * Configuracao de limiar para um subcritrio com faixas de conforto.
 * O valor ideal esta dentro de uma faixa (ex: altura da sanita 43-48 cm).
 *
 * - `idealMin` / `idealMax`: faixa que pontua 100
 * - `acceptableMin` / `acceptableMax`: faixa que pontua 50
 * - `limitMin` / `limitMax`: faixa que pontua 25
 * Fora de `limitMin`/`limitMax`, pontua 10.
 */
export interface RangeThreshold {
  readonly idealMin: number;
  readonly idealMax: number;
  readonly acceptableMin: number;
  readonly acceptableMax: number;
  readonly limitMin: number;
  readonly limitMax: number;
  readonly outsideScore: number;
}

/** Uniao de tipos de limiar. */
export type ThresholdConfig = NumericThreshold | RangeThreshold;

/** Verifica se um limiar e do tipo RangeThreshold. */
export function isRangeThreshold(t: ThresholdConfig): t is RangeThreshold {
  return "idealMin" in t;
}

// ---------------------------------------------------------------------------
// Limiares concretos por subcritrio
// ---------------------------------------------------------------------------

/** Largura da porta da entrada (cm). */
export const DOOR_WIDTH_THRESHOLD: NumericThreshold = {
  min: 60,
  acceptable: 77,
  good: 85,
  excellent: 95,
};

/** Inclinacao da rampa (%). Valores menores sao melhores. */
export const RAMP_INCLINE_THRESHOLD: NumericThreshold = {
  min: 15,
  acceptable: 8,
  good: 6,
  excellent: 4,
  inverted: true,
};

/** Espaco de rotacao / turning space (diametro em cm). */
export const TURNING_SPACE_THRESHOLD: NumericThreshold = {
  min: 110,
  acceptable: 150,
  good: 160,
  excellent: 170,
};

/** Largura minima do corredor (cm). */
export const CORRIDOR_WIDTH_THRESHOLD: NumericThreshold = {
  min: 60,
  acceptable: 90,
  good: 120,
  excellent: 150,
};

/** Largura da porta da casa de banho (cm). */
export const BATHROOM_DOOR_WIDTH_THRESHOLD: NumericThreshold = {
  min: 60,
  acceptable: 77,
  good: 85,
  excellent: 95,
};

/** Espaco de rotacao na casa de banho (diametro em cm). */
export const BATHROOM_TURNING_SPACE_THRESHOLD: NumericThreshold = {
  min: 110,
  acceptable: 150,
  good: 160,
  excellent: 170,
};

/** Distancia do estacionamento a entrada (metros). Menor e melhor. */
export const PARKING_DISTANCE_THRESHOLD: NumericThreshold = {
  min: 250,
  acceptable: 100,
  good: 50,
  excellent: 20,
  inverted: true,
};

/** Largura do lugar de estacionamento (cm). */
export const PARKING_SPACE_WIDTH_THRESHOLD: NumericThreshold = {
  min: 200,
  acceptable: 244,
  good: 330,
  excellent: 370,
};

/** Largura do corredor de acesso no estacionamento (cm). */
export const ACCESS_AISLE_WIDTH_THRESHOLD: NumericThreshold = {
  min: 90,
  acceptable: 120,
  good: 140,
  excellent: 152,
};

/** Altura da mesa (cm). Faixa ideal: 71-86 cm (ADA 902.3). */
export const TABLE_HEIGHT_THRESHOLD: RangeThreshold = {
  idealMin: 71,
  idealMax: 86,
  acceptableMin: 68,
  acceptableMax: 90,
  limitMin: 65,
  limitMax: 95,
  outsideScore: 10,
};

/** Espaco livre sob a mesa (cm). */
export const UNDER_TABLE_CLEARANCE_THRESHOLD: NumericThreshold = {
  min: 55,
  acceptable: 65,
  good: 68.5,
  excellent: 73,
};

/** Espaco entre mesas (cm). */
export const TABLE_SPACING_THRESHOLD: NumericThreshold = {
  min: 50,
  acceptable: 75,
  good: 90,
  excellent: 120,
};

/** Altura da sanita (cm). Faixa ideal: 43-48 cm (ADA 604.4). */
export const TOILET_HEIGHT_THRESHOLD: RangeThreshold = {
  idealMin: 43,
  idealMax: 48,
  acceptableMin: 40,
  acceptableMax: 52,
  limitMin: 36,
  limitMax: 56,
  outsideScore: 10,
};

/** Altura do lavatorio (cm). Menor e melhor (ate um ponto). */
export const SINK_HEIGHT_THRESHOLD: NumericThreshold = {
  min: 100,
  acceptable: 91,
  good: 86,
  excellent: 80,
  inverted: true,
};

/** Altura do balcao (cm). Menor e melhor. */
export const COUNTER_HEIGHT_THRESHOLD: NumericThreshold = {
  min: 120,
  acceptable: 100,
  good: 91,
  excellent: 86,
  inverted: true,
};

/** Altura da campainha (cm). Menor e melhor (acessivel de cadeira). */
export const DOORBELL_HEIGHT_THRESHOLD: NumericThreshold = {
  min: 150,
  acceptable: 130,
  good: 120,
  excellent: 100,
  inverted: true,
};

// ---------------------------------------------------------------------------
// Exportacao agrupada para conveniencia
// ---------------------------------------------------------------------------

/** Todos os limiares numericos agrupados por identificador. */
export const ALL_THRESHOLDS = {
  doorWidth: DOOR_WIDTH_THRESHOLD,
  rampIncline: RAMP_INCLINE_THRESHOLD,
  turningSpace: TURNING_SPACE_THRESHOLD,
  corridorWidth: CORRIDOR_WIDTH_THRESHOLD,
  bathroomDoorWidth: BATHROOM_DOOR_WIDTH_THRESHOLD,
  bathroomTurningSpace: BATHROOM_TURNING_SPACE_THRESHOLD,
  parkingDistance: PARKING_DISTANCE_THRESHOLD,
  parkingSpaceWidth: PARKING_SPACE_WIDTH_THRESHOLD,
  accessAisleWidth: ACCESS_AISLE_WIDTH_THRESHOLD,
  tableHeight: TABLE_HEIGHT_THRESHOLD,
  underTableClearance: UNDER_TABLE_CLEARANCE_THRESHOLD,
  tableSpacing: TABLE_SPACING_THRESHOLD,
  toiletHeight: TOILET_HEIGHT_THRESHOLD,
  sinkHeight: SINK_HEIGHT_THRESHOLD,
  counterHeight: COUNTER_HEIGHT_THRESHOLD,
  doorbellHeight: DOORBELL_HEIGHT_THRESHOLD,
} as const;
