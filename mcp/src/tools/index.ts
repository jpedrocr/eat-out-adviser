/**
 * Ferramentas MCP do Eat Out Adviser.
 *
 * Cada ferramenta expõe uma funcionalidade específica da plataforma
 * a agentes de IA — pesquisa de restaurantes, detalhes, pontuação
 * de acessibilidade e cálculo personalizado.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Regista todas as ferramentas MCP no servidor.
 */
export function registerTools(server: McpServer): void {
  server.tool(
    "search_restaurants",
    "Pesquisar restaurantes com filtros opcionais de acessibilidade, cidade e tipo de cozinha.",
    {
      query: z.string().describe("Texto de pesquisa livre"),
      city: z.string().optional().describe("Filtrar por cidade"),
      cuisine: z.string().optional().describe("Filtrar por tipo de cozinha"),
      minAccessibilityScore: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Pontuação mínima de acessibilidade (0-100)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(10)
        .describe("Número máximo de resultados (padrão: 10)"),
    },
    ({ query, city, cuisine, minAccessibilityScore, limit }) => {
      // TODO: integrar com @eat-out-adviser/db para pesquisa real
      const placeholder = {
        query,
        filters: { city, cuisine, minAccessibilityScore },
        limit,
        results: [],
        total: 0,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(placeholder, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "get_restaurant_details",
    "Obter detalhes completos de um restaurante, incluindo perfil de acessibilidade.",
    {
      slug: z.string().describe("Slug único do restaurante"),
    },
    ({ slug }) => {
      // TODO: integrar com @eat-out-adviser/db para obter dados reais
      const placeholder = {
        slug,
        name: `Restaurante (${slug})`,
        address: null,
        accessibilityProfile: null,
        message: "Dados de placeholder — integração com a base de dados pendente",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(placeholder, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "get_accessibility_score",
    "Obter a pontuação de acessibilidade detalhada de um restaurante, com discriminação por categoria.",
    {
      restaurantId: z.string().uuid().describe("UUID do restaurante"),
    },
    ({ restaurantId }) => {
      // TODO: integrar com @eat-out-adviser/scoring para cálculo real
      const placeholder = {
        restaurantId,
        overallScore: null,
        categories: {
          entrance: null,
          interior: null,
          restroom: null,
          parking: null,
          staff: null,
        },
        message: "Dados de placeholder — integração com o módulo de scoring pendente",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(placeholder, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "calculate_personalized_score",
    "Calcular uma pontuação de acessibilidade personalizada para um restaurante com base no perfil de mobilidade do utilizador.",
    {
      restaurantId: z.string().uuid().describe("UUID do restaurante"),
      mobilityType: z
        .string()
        .describe(
          "Tipo de mobilidade do utilizador (ex.: 'manual_wheelchair', 'electric_wheelchair', 'walker')",
        ),
      wheelchairWidth: z
        .number()
        .positive()
        .optional()
        .describe("Largura da cadeira de rodas em centímetros"),
      turningRadiusNeeded: z
        .number()
        .positive()
        .optional()
        .describe("Raio de viragem necessário em centímetros"),
    },
    ({ restaurantId, mobilityType, wheelchairWidth, turningRadiusNeeded }) => {
      // TODO: integrar com @eat-out-adviser/scoring para cálculo personalizado
      const placeholder = {
        restaurantId,
        userProfile: {
          mobilityType,
          wheelchairWidth: wheelchairWidth ?? null,
          turningRadiusNeeded: turningRadiusNeeded ?? null,
        },
        personalizedScore: null,
        recommendations: [],
        message: "Dados de placeholder — integração com o módulo de scoring pendente",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(placeholder, null, 2),
          },
        ],
      };
    },
  );
}
