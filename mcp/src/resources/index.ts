/**
 * Recursos MCP do Eat Out Adviser.
 *
 * Expõe dados de restaurantes como recursos legíveis por agentes de IA,
 * incluindo uma listagem resumida e detalhes individuais com dados
 * de acessibilidade.
 */

import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Regista todos os recursos MCP no servidor.
 */
export function registerResources(server: McpServer): void {
  server.resource(
    "restaurant-list",
    "restaurants://list",
    {
      description:
        "Lista de todos os restaurantes ativos (vista resumida com nome, cidade e pontuação de acessibilidade)",
      mimeType: "application/json",
    },
    (uri) => {
      // TODO: integrar com @eat-out-adviser/db para obter dados reais
      const placeholder = {
        restaurants: [],
        total: 0,
        message: "Dados de placeholder — integração com a base de dados pendente",
      };

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(placeholder, null, 2),
          },
        ],
      };
    },
  );

  server.resource(
    "restaurant-details",
    new ResourceTemplate("restaurants://{slug}", {
      list: () => ({
        resources: [
          // TODO: popular com slugs reais da base de dados
        ],
      }),
    }),
    {
      description: "Detalhes completos de um restaurante, incluindo dados de acessibilidade",
      mimeType: "application/json",
    },
    (uri, { slug }) => {
      // TODO: integrar com @eat-out-adviser/db para obter dados reais
      const restaurantSlug = Array.isArray(slug) ? slug[0] : slug;

      const placeholder = {
        slug: restaurantSlug,
        name: null,
        address: null,
        cuisine: null,
        accessibilityScore: null,
        accessibilityProfile: null,
        message: "Dados de placeholder — integração com a base de dados pendente",
      };

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(placeholder, null, 2),
          },
        ],
      };
    },
  );
}
