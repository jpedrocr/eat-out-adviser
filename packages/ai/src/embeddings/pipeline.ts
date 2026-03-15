/**
 * Pipeline de geracao de embeddings em lote.
 *
 * Processa restaurantes, avaliacoes e pratos que ainda nao possuem
 * embeddings, gerando-os e atualizando os registos na base de dados.
 */

import { sql } from "@eat-out-adviser/db";

import { generateEmbeddingsBatch } from "./client.js";

/** Tamanho do lote para processamento de embeddings. */
const BATCH_SIZE = 50;

/** Opcoes de configuracao do pipeline. */
export interface PipelineOptions {
  /** Tamanho do lote (defeito: 50). */
  batchSize?: number;
  /** Callback invocado apos cada lote processado. */
  onBatchComplete?: (processed: number, total: number) => void;
}

/**
 * Resultado do processamento de um pipeline de embeddings.
 */
export interface PipelineResult {
  /** Numero total de registos processados. */
  processed: number;
  /** Numero de registos ignorados (ja tinham embedding). */
  skipped: number;
  /** Numero de erros encontrados. */
  errors: number;
  /** Duracao total em milissegundos. */
  durationMs: number;
}

/**
 * Gera embeddings para todos os restaurantes sem embedding.
 *
 * Constroi o texto a partir do nome, descricao, tipo de cozinha,
 * cidade e destaques de acessibilidade do restaurante.
 *
 * @param options - Opcoes de configuracao do pipeline.
 * @returns Resultado do processamento.
 */
export async function embedRestaurants(options?: PipelineOptions): Promise<PipelineResult> {
  const startTime = Date.now();
  const batchSize = options?.batchSize ?? BATCH_SIZE;
  let processed = 0;
  let errors = 0;

  // Buscar restaurantes sem embedding
  // TODO: Adaptar query ao esquema final da tabela de restaurantes
  const rows = await sql`
    SELECT r.id, r.name, r.description, r.cuisine_types, r.city, r.district
    FROM restaurants r
    WHERE r.embedding IS NULL
    ORDER BY r.created_at ASC
  `;

  const total = rows.length;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    try {
      const texts = batch.map((row) => {
        const parts = [
          row.name as string,
          row.description ? String(row.description) : "",
          row.cuisine_types ? String(row.cuisine_types) : "",
          row.city as string,
          row.district ? String(row.district) : "",
        ].filter(Boolean);
        return parts.join(" | ");
      });

      const embeddings = await generateEmbeddingsBatch(texts, 10);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const embedding = embeddings[j];
        if (!row || !embedding) continue;

        await sql`
          UPDATE restaurants
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${row.id as string}
        `;
      }

      processed += batch.length;
    } catch (error) {
      errors += batch.length;
      console.error(`Erro ao processar lote de restaurantes (offset ${i}):`, error);
    }

    options?.onBatchComplete?.(processed, total);
  }

  return {
    processed,
    skipped: 0,
    errors,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Gera embeddings para todas as avaliacoes sem embedding.
 *
 * Constroi o texto a partir do conteudo da avaliacao, tipo de mobilidade
 * na visita e classificacoes.
 *
 * @param options - Opcoes de configuracao do pipeline.
 * @returns Resultado do processamento.
 */
export async function embedReviews(options?: PipelineOptions): Promise<PipelineResult> {
  const startTime = Date.now();
  const batchSize = options?.batchSize ?? BATCH_SIZE;
  let processed = 0;
  let errors = 0;

  // Buscar avaliacoes sem embedding
  // TODO: Adaptar query ao esquema final da tabela de avaliacoes
  const rows = await sql`
    SELECT rv.id, rv.text, rv.mobility_type_at_visit, rv.accessibility_rating
    FROM reviews rv
    WHERE rv.embedding IS NULL AND rv.text IS NOT NULL
    ORDER BY rv.created_at ASC
  `;

  const total = rows.length;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    try {
      const texts = batch.map((row) => {
        const parts = [
          row.text as string,
          row.mobility_type_at_visit ? `Mobilidade: ${row.mobility_type_at_visit as string}` : "",
          `Acessibilidade: ${String(row.accessibility_rating)}/5`,
        ].filter(Boolean);
        return parts.join(" | ");
      });

      const embeddings = await generateEmbeddingsBatch(texts, 10);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const embedding = embeddings[j];
        if (!row || !embedding) continue;

        await sql`
          UPDATE reviews
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${row.id as string}
        `;
      }

      processed += batch.length;
    } catch (error) {
      errors += batch.length;
      console.error(`Erro ao processar lote de avaliacoes (offset ${i}):`, error);
    }

    options?.onBatchComplete?.(processed, total);
  }

  return {
    processed,
    skipped: 0,
    errors,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Gera embeddings para todos os pratos sem embedding.
 *
 * Constroi o texto a partir do nome, descricao e alergenos do prato.
 *
 * @param options - Opcoes de configuracao do pipeline.
 * @returns Resultado do processamento.
 */
export async function embedDishes(options?: PipelineOptions): Promise<PipelineResult> {
  const startTime = Date.now();
  const batchSize = options?.batchSize ?? BATCH_SIZE;
  let processed = 0;
  let errors = 0;

  // Buscar pratos sem embedding
  // TODO: Adaptar query ao esquema final da tabela de pratos
  const rows = await sql`
    SELECT d.id, d.name, d.description, d.allergens
    FROM dishes d
    WHERE d.embedding IS NULL
    ORDER BY d.created_at ASC
  `;

  const total = rows.length;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    try {
      const texts = batch.map((row) => {
        const parts = [
          row.name as string,
          row.description ? String(row.description) : "",
          row.allergens ? `Alergenos: ${String(row.allergens)}` : "",
        ].filter(Boolean);
        return parts.join(" | ");
      });

      const embeddings = await generateEmbeddingsBatch(texts, 10);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const embedding = embeddings[j];
        if (!row || !embedding) continue;

        await sql`
          UPDATE dishes
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${row.id as string}
        `;
      }

      processed += batch.length;
    } catch (error) {
      errors += batch.length;
      console.error(`Erro ao processar lote de pratos (offset ${i}):`, error);
    }

    options?.onBatchComplete?.(processed, total);
  }

  return {
    processed,
    skipped: 0,
    errors,
    durationMs: Date.now() - startTime,
  };
}
