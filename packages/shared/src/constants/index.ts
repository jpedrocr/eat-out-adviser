// ---------------------------------------------------------------------------
// Constantes partilhadas do Eat Out Adviser
// ---------------------------------------------------------------------------

import type { AccessibilityCategory, Locale } from "../types/index.js";

// --- Categorias de acessibilidade e pesos base ---

/** Categorias do sistema de pontuacao com pesos base (soma = 1.0). */
export const ACCESSIBILITY_CATEGORIES: readonly AccessibilityCategory[] = [
  { key: "entrance", labelPt: "Entrada", labelEn: "Entrance", weight: 0.25 },
  { key: "parking", labelPt: "Estacionamento", labelEn: "Parking", weight: 0.1 },
  { key: "interior", labelPt: "Interior", labelEn: "Interior", weight: 0.2 },
  { key: "seating", labelPt: "Mesas", labelEn: "Seating", weight: 0.15 },
  { key: "bathroom", labelPt: "Casa de Banho", labelEn: "Bathroom", weight: 0.25 },
  { key: "communication", labelPt: "Comunicacao", labelEn: "Communication", weight: 0.05 },
] as const;

/**
 * Pesos por tipo de mobilidade. Cada entrada mapeia categoria -> peso.
 * Os pesos de cada perfil somam 1.0.
 */
export const MOBILITY_WEIGHTS: Record<string, Record<string, number>> = {
  electric_wheelchair: {
    entrance: 0.25,
    parking: 0.1,
    interior: 0.2,
    seating: 0.1,
    bathroom: 0.3,
    communication: 0.05,
  },
  manual_wheelchair: {
    entrance: 0.25,
    parking: 0.1,
    interior: 0.2,
    seating: 0.15,
    bathroom: 0.25,
    communication: 0.05,
  },
  scooter: {
    entrance: 0.2,
    parking: 0.15,
    interior: 0.3,
    seating: 0.1,
    bathroom: 0.2,
    communication: 0.05,
  },
  walker: {
    entrance: 0.2,
    parking: 0.1,
    interior: 0.25,
    seating: 0.15,
    bathroom: 0.25,
    communication: 0.05,
  },
  crutches: {
    entrance: 0.3,
    parking: 0.1,
    interior: 0.2,
    seating: 0.1,
    bathroom: 0.25,
    communication: 0.05,
  },
  cane: {
    entrance: 0.25,
    parking: 0.1,
    interior: 0.2,
    seating: 0.15,
    bathroom: 0.2,
    communication: 0.1,
  },
  none: {
    entrance: 0.2,
    parking: 0.15,
    interior: 0.2,
    seating: 0.15,
    bathroom: 0.2,
    communication: 0.1,
  },
  other: {
    entrance: 0.25,
    parking: 0.1,
    interior: 0.2,
    seating: 0.15,
    bathroom: 0.25,
    communication: 0.05,
  },
} as const;

// --- Sistema semaforo ---

/** Limiares para a classificacao semaforo. */
export const TRAFFIC_LIGHT_THRESHOLDS = {
  /** Pontuacao >= 70 -> verde (acessivel). */
  green: 70,
  /** Pontuacao >= 40 -> amarelo (parcialmente acessivel). */
  yellow: 40,
  /** Pontuacao < 40 -> vermelho (barreiras significativas). */
  red: 0,
} as const;

// --- Etiquetas de pontuacao em portugues ---

/** Mapeamento de intervalos de pontuacao para etiquetas descritivas em portugues. */
export const SCORE_LABELS: readonly {
  min: number;
  max: number;
  labelPt: string;
  labelEn: string;
}[] = [
  { min: 90, max: 100, labelPt: "Excelente", labelEn: "Excellent" },
  { min: 70, max: 89, labelPt: "Bom", labelEn: "Good" },
  { min: 50, max: 69, labelPt: "Razoavel", labelEn: "Fair" },
  { min: 30, max: 49, labelPt: "Limitado", labelEn: "Limited" },
  { min: 0, max: 29, labelPt: "Inacessivel", labelEn: "Inaccessible" },
] as const;

// --- Localizacao ---

/** Idiomas suportados pela plataforma. */
export const SUPPORTED_LOCALES: readonly Locale[] = ["pt", "en"] as const;

/** Idioma por defeito. */
export const DEFAULT_LOCALE: Locale = "pt";

// --- Limites gerais ---

/** Classificacao maxima para avaliacoes (comida, servico, etc.). */
export const MAX_RATING = 5;

/** Dimensao dos vectores de embedding (nomic-embed-text-v2). */
export const VECTOR_DIMENSIONS = 1024;

/** Numero maximo de resultados por pagina por defeito. */
export const DEFAULT_PAGE_SIZE = 20;

/** Numero maximo de resultados por pagina. */
export const MAX_PAGE_SIZE = 100;

// --- Limiares de referencia internacionais ---

/**
 * Limiares de acessibilidade por norma internacional.
 * Todas as medidas em centimetros (cm) excepto inclinacao (percentagem).
 *
 * Fontes: DL 163/2006 (Portugal), ADA (EUA), ISO 21542:2021, UK Building Regulations Part M.
 */
export const INTERNATIONAL_THRESHOLDS = {
  /** Largura minima da porta (cm). */
  doorWidth: {
    portugal: 77,
    eu: 80,
    ada: 81.3,
    uk: 77.5,
    recommended: 90,
  },
  /** Inclinacao maxima da rampa (percentagem). */
  rampIncline: {
    portugal: 8,
    eu: 6,
    ada: 8.33,
    uk: 8.33,
    recommended: 6,
  },
  /** Largura minima da rampa (cm). */
  rampWidth: {
    portugal: 120,
    eu: 120,
    ada: 91.4,
    uk: 100,
    recommended: 120,
  },
  /** Espaco de rotacao minimo (diametro em cm). */
  turningSpace: {
    portugal: 150,
    eu: 150,
    ada: 152,
    uk: 150,
    recommended: 170,
  },
  /** Largura minima do corredor (cm). */
  corridorWidth: {
    portugal: 120,
    eu: 120,
    ada: 91.4,
    uk: 120,
    recommended: 120,
  },
  /** Largura minima da porta da casa de banho (cm). */
  bathroomDoorWidth: {
    portugal: 77,
    eu: 80,
    ada: 81.3,
    uk: 77.5,
    recommended: 90,
  },
  /** Espaco de rotacao na casa de banho (diametro em cm). */
  bathroomTurningSpace: {
    portugal: 150,
    eu: 150,
    ada: 152,
    uk: 150,
    recommended: 170,
  },
  /** Altura da sanita (cm). Intervalo: [min, max]. */
  toiletHeight: {
    portugal: { min: 45, max: 50 },
    eu: { min: 43, max: 48 },
    ada: { min: 43, max: 48 },
    uk: { min: 46.5, max: 49.5 },
    recommended: { min: 45, max: 48 },
  },
  /** Largura do lugar de estacionamento acessivel (cm). */
  parkingSpaceWidth: {
    portugal: 250,
    eu: 250,
    ada: 244,
    uk: 240,
    recommended: 330,
  },
} as const;
