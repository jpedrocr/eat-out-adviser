// ---------------------------------------------------------------------------
// Pesos das categorias de acessibilidade por tipo de mobilidade
// ---------------------------------------------------------------------------

import type { MobilityType } from "@eat-out-adviser/shared";

/**
 * Chaves das categorias de acessibilidade.
 * Correspondem as 6 categorias do sistema de pontuacao.
 */
export type CategoryKey =
  | "entrance"
  | "parking"
  | "interior"
  | "seating"
  | "bathroom"
  | "communication";

/** Mapa de pesos por categoria (soma = 1.0). */
export type WeightMap = Record<CategoryKey, number>;

/** Todas as categorias do sistema. */
export const CATEGORY_KEYS: readonly CategoryKey[] = [
  "entrance",
  "parking",
  "interior",
  "seating",
  "bathroom",
  "communication",
] as const;

/**
 * Pesos base das categorias (perfil por defeito / cadeira manual).
 * Soma = 1.0.
 */
const BASE_WEIGHTS: WeightMap = {
  entrance: 0.25,
  parking: 0.1,
  interior: 0.2,
  seating: 0.15,
  bathroom: 0.25,
  communication: 0.05,
};

/**
 * Pesos ajustados por tipo de mobilidade.
 * Cada perfil soma 1.0 e reflecte as prioridades especificas do utilizador.
 *
 * Fontes dos ajustes:
 * - Cadeira electrica: casa de banho mais critica (equipamento maior)
 * - Scooter: interior e estacionamento mais relevantes (raio de viragem grande)
 * - Andarilho: estabilidade e apoios prioritarios
 * - Muletas: entrada critica (dificuldade com degraus e superficies)
 * - Bengala: ajustes ligeiros, comunicacao mais valorizada
 */
const MOBILITY_WEIGHT_OVERRIDES: Record<MobilityType, WeightMap> = {
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
};

/**
 * Devolve o mapa de pesos para um dado tipo de mobilidade.
 *
 * @param mobilityType - Tipo de mobilidade do utilizador. Se omitido, devolve pesos base.
 * @returns Mapa de pesos por categoria (soma = 1.0).
 */
export function getWeightsForMobilityType(mobilityType?: MobilityType): WeightMap {
  if (!mobilityType) {
    return { ...BASE_WEIGHTS };
  }
  return { ...MOBILITY_WEIGHT_OVERRIDES[mobilityType] };
}
