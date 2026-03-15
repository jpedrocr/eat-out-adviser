/**
 * Construcao de contexto enriquecido para o pipeline RAG.
 *
 * Monta a string de contexto enviada ao Gemini juntamente com
 * os resultados da pesquisa, perfil do utilizador e dados de acessibilidade.
 */

import type { Restaurant, UserAccessibilityProfile } from "@eat-out-adviser/shared";
import { ACCESSIBILITY_CATEGORIES, TRAFFIC_LIGHT_THRESHOLDS } from "@eat-out-adviser/shared";

import type { SearchResult } from "./search.js";

/** Dados de acessibilidade resumidos para inclusao no contexto. */
export interface RestaurantContextData {
  /** Restaurante base. */
  restaurant: Restaurant;
  /** Resultado da pesquisa com pontuacoes de relevancia. */
  searchResult?: SearchResult;
  /** Pontuacao de acessibilidade geral (0-100). */
  accessibilityScore?: number | null;
  /** Pontuacoes por categoria. */
  categoryScores?: {
    entrance?: number | null;
    parking?: number | null;
    interior?: number | null;
    seating?: number | null;
    bathroom?: number | null;
    communication?: number | null;
  };
  /** Resumo das avaliacoes (gerado por IA). */
  reviewSummary?: string | null;
}

/**
 * Determina a classificacao semaforo com base na pontuacao.
 */
function getTrafficLight(score: number): string {
  if (score >= TRAFFIC_LIGHT_THRESHOLDS.green) return "VERDE (acessivel)";
  if (score >= TRAFFIC_LIGHT_THRESHOLDS.yellow) return "AMARELO (parcialmente acessivel)";
  return "VERMELHO (barreiras significativas)";
}

/**
 * Formata o perfil de acessibilidade do utilizador para o contexto.
 */
function formatUserProfile(profile: UserAccessibilityProfile): string {
  const lines: string[] = [
    "## Perfil de Acessibilidade do Utilizador",
    "",
    `- Tipo de mobilidade: ${profile.mobilityType}`,
  ];

  if (profile.wheelchairWidth !== null) {
    lines.push(`- Largura da cadeira: ${String(profile.wheelchairWidth)} cm`);
  }
  if (profile.wheelchairLength !== null) {
    lines.push(`- Comprimento da cadeira: ${String(profile.wheelchairLength)} cm`);
  }
  if (profile.turningRadiusNeeded !== null) {
    lines.push(`- Raio de rotacao necessario: ${String(profile.turningRadiusNeeded)} cm`);
  }
  if (profile.maxRampIncline !== null) {
    lines.push(`- Inclinacao maxima de rampa: ${String(profile.maxRampIncline)}%`);
  }
  if (profile.needsElevator) {
    lines.push("- Necessita de elevador: Sim");
  }
  if (profile.needsAccessibleBathroom) {
    lines.push("- Necessita de casa de banho acessivel: Sim");
  }
  if (profile.bathroomTransferSide !== "not_applicable") {
    lines.push(`- Lado de transferencia preferido: ${profile.bathroomTransferSide}`);
  }
  if (profile.dietaryRestrictions?.length) {
    lines.push(`- Restricoes alimentares: ${profile.dietaryRestrictions.join(", ")}`);
  }
  if (profile.allergies?.length) {
    lines.push(`- Alergias: ${profile.allergies.join(", ")}`);
  }
  if (profile.preferredCuisines?.length) {
    lines.push(`- Cozinhas preferidas: ${profile.preferredCuisines.join(", ")}`);
  }

  return lines.join("\n");
}

/**
 * Formata os dados de um restaurante para o contexto.
 */
function formatRestaurant(data: RestaurantContextData, index: number): string {
  const { restaurant } = data;
  const lines: string[] = [
    `### ${String(index + 1)}. ${restaurant.name}`,
    "",
    `- Endereco: ${restaurant.address}, ${restaurant.city}`,
  ];

  if (restaurant.cuisineTypes?.length) {
    lines.push(`- Cozinha: ${restaurant.cuisineTypes.join(", ")}`);
  }
  if (restaurant.priceRange) {
    lines.push(`- Faixa de preco: ${restaurant.priceRange}`);
  }

  if (data.accessibilityScore !== undefined && data.accessibilityScore !== null) {
    lines.push(
      `- Pontuacao de acessibilidade: ${String(data.accessibilityScore)}/100 — ${getTrafficLight(data.accessibilityScore)}`,
    );
  }

  if (data.categoryScores) {
    lines.push("- Pontuacoes por categoria:");
    for (const cat of ACCESSIBILITY_CATEGORIES) {
      const score = data.categoryScores[cat.key as keyof typeof data.categoryScores];
      if (score !== undefined && score !== null) {
        lines.push(`  - ${cat.labelPt}: ${String(score)}/100`);
      }
    }
  }

  if (data.searchResult) {
    lines.push(
      `- Relevancia da pesquisa: ${String(Math.round(data.searchResult.combinedScore * 100))}%`,
    );
  }

  if (data.reviewSummary) {
    lines.push(`- Resumo das avaliacoes: ${data.reviewSummary}`);
  }

  return lines.join("\n");
}

/**
 * Constroi o contexto enriquecido para enviar ao Gemini.
 *
 * Inclui o perfil de acessibilidade do utilizador, os restaurantes
 * encontrados com as suas pontuacoes e um sumario das categorias
 * de avaliacao utilizadas.
 *
 * @param restaurants - Lista de restaurantes com dados de contexto.
 * @param userProfile - Perfil de acessibilidade do utilizador.
 * @returns String de contexto formatada para o prompt do Gemini.
 */
export function buildRAGContext(
  restaurants: RestaurantContextData[],
  userProfile: UserAccessibilityProfile,
): string {
  const sections: string[] = [];

  // Perfil do utilizador
  sections.push(formatUserProfile(userProfile));

  // Resultados encontrados
  sections.push("");
  sections.push(`## Restaurantes Encontrados (${String(restaurants.length)} resultados)`);
  sections.push("");

  for (let i = 0; i < restaurants.length; i++) {
    const data = restaurants[i];
    if (data) {
      sections.push(formatRestaurant(data, i));
      sections.push("");
    }
  }

  // Legenda das categorias
  sections.push("## Categorias de Avaliacao");
  sections.push("");
  for (const cat of ACCESSIBILITY_CATEGORIES) {
    sections.push(
      `- **${cat.labelPt}** (${String(Math.round(cat.weight * 100))}%): ${cat.labelEn}`,
    );
  }

  // Legenda do semaforo
  sections.push("");
  sections.push("## Classificacao Semaforo");
  sections.push(`- VERDE: >= ${String(TRAFFIC_LIGHT_THRESHOLDS.green)} pontos — Acessivel`);
  sections.push(
    `- AMARELO: >= ${String(TRAFFIC_LIGHT_THRESHOLDS.yellow)} pontos — Parcialmente acessivel`,
  );
  sections.push(
    `- VERMELHO: < ${String(TRAFFIC_LIGHT_THRESHOLDS.yellow)} pontos — Barreiras significativas`,
  );

  return sections.join("\n");
}
