/**
 * @eat-out-adviser/ai
 *
 * Pacote de integracao com IA do Eat Out Adviser.
 * Utiliza Google Gemini para LLM, visao e embeddings.
 */

// --- Cliente Gemini ---
export { genai, MODELS } from "./gemini/client.js";
export type { ModelName } from "./gemini/client.js";

// --- Prompts ---
export { SEARCH_SYSTEM_PROMPT } from "./gemini/prompts/search.js";
export type { SearchQueryEntities } from "./gemini/prompts/search.js";

export { VISION_ANALYSIS_PROMPT } from "./gemini/prompts/vision.js";
export type { VisionAnalysisResult, VisionFeature } from "./gemini/prompts/vision.js";

export { ASSISTANT_SYSTEM_PROMPT } from "./gemini/prompts/assistant.js";

export { REVIEW_SUMMARY_PROMPT } from "./gemini/prompts/summary.js";
export type { ReviewSummaryResult } from "./gemini/prompts/summary.js";

export { TRANSLATION_PROMPT } from "./gemini/prompts/translation.js";
export type { TranslationResult } from "./gemini/prompts/translation.js";

// --- Ferramentas (function calling) ---
export {
  parseSearchQueryDeclaration,
  hybridSearchRestaurantsDeclaration,
  rerankWithAccessibilityDeclaration,
  toolDeclarations,
} from "./gemini/tools/index.js";

// --- Embeddings ---
export { generateEmbedding, generateEmbeddingsBatch } from "./embeddings/client.js";
export type { EmbeddingProvider } from "./embeddings/client.js";

export { embedRestaurants, embedReviews, embedDishes } from "./embeddings/pipeline.js";
export type { PipelineOptions, PipelineResult } from "./embeddings/pipeline.js";

// --- Matching e pontuacao ---
export { calculateMatchScore } from "./matching/scorer.js";
export type { MatchScoreResult } from "./matching/scorer.js";

export { getWeightsForMobilityType, DEFAULT_WEIGHTS, CATEGORY_KEYS } from "./matching/weights.js";
export type { CategoryWeights } from "./matching/weights.js";

// --- RAG ---
export { hybridSearch } from "./rag/search.js";
export type { StructuredFilters, SearchResult } from "./rag/search.js";

export { buildRAGContext } from "./rag/context.js";
export type { RestaurantContextData } from "./rag/context.js";
