#!/usr/bin/env node

/**
 * Servidor MCP do Eat Out Adviser.
 *
 * Expõe funcionalidades da plataforma (pesquisa de restaurantes,
 * pontuação de acessibilidade, etc.) a agentes de IA através do
 * Model Context Protocol via transporte stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";

const server = new McpServer({
  name: "eat-out-adviser",
  version: "0.1.0",
});

registerTools(server);
registerResources(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Servidor MCP Eat Out Adviser a correr via stdio");
}

main().catch((error: unknown) => {
  console.error("Erro fatal no servidor MCP:", error);
  process.exit(1);
});
