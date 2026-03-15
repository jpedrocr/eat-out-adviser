/**
 * Pesquisa hibrida de restaurantes.
 *
 * Combina pesquisa vetorial (pgvector, distancia cosseno),
 * pesquisa full-text (tsvector/tsquery) e filtros estruturados
 * para devolver resultados ordenados por relevancia.
 */

import { sql } from "@eat-out-adviser/db";
import type { PriceRange } from "@eat-out-adviser/shared";

/** Filtros estruturados para a pesquisa de restaurantes. */
export interface StructuredFilters {
  /** Tipo de cozinha (ex: "portuguesa", "italiana"). */
  cuisineType?: string;
  /** Cidade. */
  city?: string;
  /** Distrito. */
  district?: string;
  /** Faixa de preco. */
  priceRange?: PriceRange;
  /** Pontuacao minima de acessibilidade (0-100). */
  minAccessibilityScore?: number;
  /** Requer entrada acessivel. */
  hasAccessibleEntrance?: boolean;
  /** Requer casa de banho acessivel. */
  hasAccessibleBathroom?: boolean;
  /** Requer estacionamento acessivel. */
  hasAccessibleParking?: boolean;
}

/** Resultado individual da pesquisa hibrida. */
export interface SearchResult {
  /** ID do restaurante. */
  id: string;
  /** Nome do restaurante. */
  name: string;
  /** Slug para URL. */
  slug: string;
  /** Cidade. */
  city: string;
  /** Pontuacao de similaridade vetorial (0-1, maior = mais similar). */
  vectorScore: number;
  /** Pontuacao de pesquisa full-text (ranking ts_rank). */
  textScore: number;
  /** Pontuacao combinada (media ponderada). */
  combinedScore: number;
  /** Pontuacao de acessibilidade geral do restaurante. */
  accessibilityScore: number | null;
}

/** Peso da pesquisa vetorial na pontuacao combinada (0-1). */
const VECTOR_WEIGHT = 0.6;

/** Peso da pesquisa full-text na pontuacao combinada (0-1). */
const TEXT_WEIGHT = 0.4;

/**
 * Executa pesquisa hibrida de restaurantes.
 *
 * Combina:
 * 1. Similaridade vetorial via pgvector (distancia cosseno)
 * 2. Pesquisa full-text via PostgreSQL tsvector/tsquery
 * 3. Filtros estruturados (cozinha, localizacao, acessibilidade)
 *
 * Os resultados sao ordenados por pontuacao combinada (vetorial + full-text).
 *
 * @param queryEmbedding - Vetor de embedding da query do utilizador.
 * @param filters - Filtros estruturados opcionais.
 * @param limit - Numero maximo de resultados (defeito: 20).
 * @returns Lista de restaurantes ordenados por relevancia.
 */
export async function hybridSearch(
  queryEmbedding: number[],
  filters: StructuredFilters = {},
  limit = 20,
): Promise<SearchResult[]> {
  // Construir clausulas WHERE dinamicas
  const conditions: string[] = ["r.status = 'active'"];

  if (filters.cuisineType) {
    conditions.push(`r.cuisine_types @> ARRAY['${filters.cuisineType}']`);
  }
  if (filters.city) {
    conditions.push(`r.city = '${filters.city}'`);
  }
  if (filters.district) {
    conditions.push(`r.district = '${filters.district}'`);
  }
  if (filters.priceRange) {
    conditions.push(`r.price_range = '${filters.priceRange}'`);
  }
  if (filters.minAccessibilityScore !== undefined) {
    conditions.push(`acs.overall_score >= ${String(filters.minAccessibilityScore)}`);
  }
  if (filters.hasAccessibleEntrance) {
    conditions.push(`ap.has_accessible_entrance = true`);
  }
  if (filters.hasAccessibleBathroom) {
    conditions.push(`ap.has_accessible_bathroom = true`);
  }
  if (filters.hasAccessibleParking) {
    conditions.push(`ap.has_accessible_parking = true`);
  }

  const whereClause = conditions.join(" AND ");
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Query hibrida: vetorial + full-text + filtros estruturados
  // TODO: Adaptar nomes de tabelas e colunas ao esquema final
  const rows = await sql`
    SELECT
      r.id,
      r.name,
      r.slug,
      r.city,
      1 - (r.embedding <=> ${embeddingStr}::vector) AS vector_score,
      COALESCE(ts_rank(r.search_vector, plainto_tsquery('portuguese', '')), 0) AS text_score,
      acs.overall_score AS accessibility_score
    FROM restaurants r
    LEFT JOIN accessibility_profiles ap ON ap.restaurant_id = r.id
    LEFT JOIN accessibility_scores acs ON acs.restaurant_id = r.id
    WHERE ${sql.unsafe(whereClause)}
      AND r.embedding IS NOT NULL
    ORDER BY (
      ${String(VECTOR_WEIGHT)} * (1 - (r.embedding <=> ${embeddingStr}::vector)) +
      ${String(TEXT_WEIGHT)} * COALESCE(ts_rank(r.search_vector, plainto_tsquery('portuguese', '')), 0)
    ) DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    city: row.city as string,
    vectorScore: Number(row.vector_score),
    textScore: Number(row.text_score),
    combinedScore: VECTOR_WEIGHT * Number(row.vector_score) + TEXT_WEIGHT * Number(row.text_score),
    accessibilityScore: row.accessibility_score !== null ? Number(row.accessibility_score) : null,
  }));
}
