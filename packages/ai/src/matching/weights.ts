/**
 * Pesos por tipo de mobilidade para o calculo de pontuacao.
 *
 * Cada tipo de mobilidade tem pesos diferentes para cada categoria,
 * refletindo a importancia relativa de cada aspeto de acessibilidade.
 */

import type { MobilityType } from "@eat-out-adviser/shared";
import { ACCESSIBILITY_CATEGORIES, MOBILITY_WEIGHTS } from "@eat-out-adviser/shared";

/** Mapeamento de categoria para peso (soma = 1.0). */
export type CategoryWeights = Record<string, number>;

/** Pesos base por defeito (soma = 1.0). */
export const DEFAULT_WEIGHTS: CategoryWeights = Object.fromEntries(
  ACCESSIBILITY_CATEGORIES.map((cat) => [cat.key, cat.weight]),
);

/**
 * Obtem os pesos de categoria para um tipo de mobilidade especifico.
 *
 * Se o tipo de mobilidade nao tiver pesos especificos definidos,
 * retorna os pesos base.
 *
 * @param mobilityType - Tipo de mobilidade do utilizador.
 * @returns Mapeamento de categoria para peso.
 */
export function getWeightsForMobilityType(mobilityType: MobilityType): CategoryWeights {
  return MOBILITY_WEIGHTS[mobilityType] ?? DEFAULT_WEIGHTS;
}

/**
 * Chaves das categorias de acessibilidade.
 * Utilizadas para iterar sobre as categorias no calculo de pontuacao.
 */
export const CATEGORY_KEYS = ACCESSIBILITY_CATEGORIES.map((cat) => cat.key);
