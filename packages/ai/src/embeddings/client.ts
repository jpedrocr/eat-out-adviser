/**
 * Cliente de embeddings com suporte a dois modos:
 * - API: Gemini Embedding (models/text-embedding-004)
 * - Local: Ollama com nomic-embed-text-v2
 *
 * O modo e selecionado pela variavel de ambiente EMBEDDING_PROVIDER.
 */

import { genai } from "../gemini/client.js";

/** Provedor de embeddings configurado. */
export type EmbeddingProvider = "gemini" | "ollama";

/** URL base do Ollama para embeddings locais. */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

/** Modelo de embedding do Ollama. */
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text-v2";

/** Modelo de embedding do Gemini. */
const GEMINI_EMBEDDING_MODEL = "text-embedding-004";

/**
 * Determina o provedor de embeddings com base na variavel de ambiente.
 * Defeito: "gemini" se EMBEDDING_PROVIDER nao estiver definida.
 */
function getProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER ?? "gemini";
  if (provider !== "gemini" && provider !== "ollama") {
    throw new Error(
      `EMBEDDING_PROVIDER invalido: "${provider}". Valores aceites: "gemini" ou "ollama".`,
    );
  }
  return provider;
}

/**
 * Gera embedding via API do Gemini.
 *
 * @param text - Texto para gerar embedding.
 * @returns Vetor de embedding.
 */
async function generateGeminiEmbedding(text: string): Promise<number[]> {
  const response = await genai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: text,
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) {
    throw new Error("Resposta do Gemini nao contem valores de embedding.");
  }

  return values;
}

/** Tipo da resposta da API de embeddings do Ollama. */
interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Gera embedding via Ollama local.
 *
 * @param text - Texto para gerar embedding.
 * @returns Vetor de embedding.
 */
async function generateOllamaEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama retornou erro ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as OllamaEmbeddingResponse;
  return data.embedding;
}

/**
 * Gera um vetor de embedding para o texto fornecido.
 *
 * Utiliza o provedor configurado pela variavel de ambiente EMBEDDING_PROVIDER:
 * - "gemini": API do Google Gemini (text-embedding-004)
 * - "ollama": Ollama local com nomic-embed-text-v2
 *
 * @param text - Texto para gerar embedding.
 * @returns Vetor de embedding (array de numeros).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = getProvider();

  switch (provider) {
    case "gemini":
      return generateGeminiEmbedding(text);
    case "ollama":
      return generateOllamaEmbedding(text);
  }
}

/**
 * Gera embeddings em lote para multiplos textos.
 *
 * Processa os textos em lotes para evitar limites de taxa.
 *
 * @param texts - Lista de textos para gerar embeddings.
 * @param batchSize - Tamanho do lote (defeito: 10).
 * @returns Lista de vetores de embedding.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize = 10,
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(generateEmbedding));
    results.push(...embeddings);
  }

  return results;
}
