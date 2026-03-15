/**
 * Declaracoes de ferramentas (function calling) para o Gemini.
 *
 * Define as funcoes que o modelo pode invocar durante a conversa:
 * pesquisa, filtragem e re-ranking de restaurantes.
 */

import type { FunctionDeclaration, Type } from "@google/genai";

/**
 * Extrai intencao e entidades de uma query de pesquisa em linguagem natural.
 */
export const parseSearchQueryDeclaration: FunctionDeclaration = {
  name: "parse_search_query",
  description:
    "Analisa uma pesquisa em linguagem natural e extrai entidades estruturadas como tipo de cozinha, localizacao, necessidades de acessibilidade, faixa de preco e tipo de mobilidade.",
  parameters: {
    type: "OBJECT" as Type,
    properties: {
      query: {
        type: "STRING" as Type,
        description: "A pesquisa em linguagem natural do utilizador.",
      },
      locale: {
        type: "STRING" as Type,
        description: "Idioma da pesquisa: pt ou en.",
        enum: ["pt", "en"],
      },
    },
    required: ["query"],
  },
};

/**
 * Combina pesquisa vetorial (pgvector) com pesquisa estruturada (filtros SQL).
 */
export const hybridSearchRestaurantsDeclaration: FunctionDeclaration = {
  name: "hybrid_search_restaurants",
  description:
    "Executa pesquisa hibrida de restaurantes combinando similaridade vetorial (embeddings) com filtros estruturados (cozinha, localizacao, preco, acessibilidade).",
  parameters: {
    type: "OBJECT" as Type,
    properties: {
      queryText: {
        type: "STRING" as Type,
        description: "Texto da pesquisa para gerar embedding e pesquisa full-text.",
      },
      cuisineType: {
        type: "STRING" as Type,
        description: "Tipo de cozinha para filtrar (ex: portuguesa, italiana).",
      },
      city: {
        type: "STRING" as Type,
        description: "Cidade para filtrar resultados.",
      },
      district: {
        type: "STRING" as Type,
        description: "Distrito para filtrar resultados.",
      },
      priceRange: {
        type: "STRING" as Type,
        description: "Faixa de preco: budget, moderate, upscale, fine_dining.",
        enum: ["budget", "moderate", "upscale", "fine_dining"],
      },
      minAccessibilityScore: {
        type: "NUMBER" as Type,
        description: "Pontuacao minima de acessibilidade (0-100).",
      },
      hasAccessibleEntrance: {
        type: "BOOLEAN" as Type,
        description: "Filtrar por entrada acessivel.",
      },
      hasAccessibleBathroom: {
        type: "BOOLEAN" as Type,
        description: "Filtrar por casa de banho acessivel.",
      },
      hasAccessibleParking: {
        type: "BOOLEAN" as Type,
        description: "Filtrar por estacionamento acessivel.",
      },
      limit: {
        type: "NUMBER" as Type,
        description: "Numero maximo de resultados (defeito: 20).",
      },
    },
    required: ["queryText"],
  },
};

/**
 * Re-ordena resultados com base no perfil de acessibilidade do utilizador.
 */
export const rerankWithAccessibilityDeclaration: FunctionDeclaration = {
  name: "rerank_with_accessibility",
  description:
    "Re-ordena uma lista de restaurantes com base no perfil de acessibilidade e tipo de mobilidade do utilizador, priorizando os que melhor correspondem as suas necessidades especificas.",
  parameters: {
    type: "OBJECT" as Type,
    properties: {
      restaurantIds: {
        type: "ARRAY" as Type,
        items: { type: "STRING" as Type },
        description: "Lista de IDs dos restaurantes a re-ordenar.",
      },
      mobilityType: {
        type: "STRING" as Type,
        description:
          "Tipo de mobilidade do utilizador: electric_wheelchair, manual_wheelchair, scooter, walker, crutches, cane, none, other.",
        enum: [
          "electric_wheelchair",
          "manual_wheelchair",
          "scooter",
          "walker",
          "crutches",
          "cane",
          "none",
          "other",
        ],
      },
      wheelchairWidth: {
        type: "NUMBER" as Type,
        description: "Largura da cadeira de rodas em cm.",
      },
      needsAccessibleBathroom: {
        type: "BOOLEAN" as Type,
        description: "Se o utilizador necessita de casa de banho acessivel.",
      },
      bathroomTransferSide: {
        type: "STRING" as Type,
        description: "Lado preferido de transferencia na casa de banho.",
        enum: ["left", "right", "both", "not_applicable"],
      },
      maxRampIncline: {
        type: "NUMBER" as Type,
        description: "Inclinacao maxima da rampa que o utilizador consegue usar (percentagem).",
      },
    },
    required: ["restaurantIds", "mobilityType"],
  },
};

/** Todas as declaracoes de ferramentas para o Gemini. */
export const toolDeclarations: FunctionDeclaration[] = [
  parseSearchQueryDeclaration,
  hybridSearchRestaurantsDeclaration,
  rerankWithAccessibilityDeclaration,
];
