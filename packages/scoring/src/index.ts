// ---------------------------------------------------------------------------
// @eat-out-adviser/scoring — API publica
//
// Motor de calculo de pontuacao de acessibilidade (0-100) com personalizacao
// por perfil de mobilidade do utilizador.
// ---------------------------------------------------------------------------

export {
  calculateCategoryScore,
  calculateGlobalScore,
  calculateNumericScore,
  calculatePersonalizedScore,
  calculateRangeScore,
  calculateSubcriterionScore,
  getScoreLabel,
  getTrafficLight,
} from "./calculator.js";

export type {
  CategoryResult,
  CriticalWarning,
  GlobalScoreResult,
  PersonalizedScoreResult,
  ScoreLabel,
  SubcriterionResult,
} from "./calculator.js";

export {
  ALL_THRESHOLDS,
  ACCESS_AISLE_WIDTH_THRESHOLD,
  BATHROOM_DOOR_WIDTH_THRESHOLD,
  BATHROOM_TURNING_SPACE_THRESHOLD,
  CORRIDOR_WIDTH_THRESHOLD,
  COUNTER_HEIGHT_THRESHOLD,
  DOOR_WIDTH_THRESHOLD,
  DOORBELL_HEIGHT_THRESHOLD,
  isRangeThreshold,
  PARKING_DISTANCE_THRESHOLD,
  PARKING_SPACE_WIDTH_THRESHOLD,
  RAMP_INCLINE_THRESHOLD,
  SINK_HEIGHT_THRESHOLD,
  TABLE_HEIGHT_THRESHOLD,
  TABLE_SPACING_THRESHOLD,
  TOILET_HEIGHT_THRESHOLD,
  TURNING_SPACE_THRESHOLD,
  UNDER_TABLE_CLEARANCE_THRESHOLD,
} from "./thresholds.js";

export type { NumericThreshold, RangeThreshold, ThresholdConfig } from "./thresholds.js";

export { CATEGORY_KEYS, getWeightsForMobilityType } from "./weights.js";

export type { CategoryKey, WeightMap } from "./weights.js";
