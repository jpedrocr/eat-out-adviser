import { sql } from "../client.js";

/**
 * Funcao de povoamento inicial da base de dados.
 * Insere dados de demonstracao para desenvolvimento e testes.
 * Os dados de seed serao adicionados a medida que as funcionalidades forem implementadas.
 */
export function seed(): void {
  console.log("A iniciar povoamento da base de dados...");

  // Os dados de seed serao adicionados por entidade conforme a implementacao avance:
  // 1. Utilizadores de teste
  // 2. Restaurantes de demonstracao (Lisboa, Porto)
  // 3. Perfis de acessibilidade detalhados
  // 4. Avaliacoes e fotografias de exemplo
  // 5. Ementas e pratos com alergenos

  console.log("Povoamento concluido com sucesso.");
}

// Executar directamente via: npx tsx src/seed/index.ts
const isDirectExecution = process.argv[1]?.endsWith("seed/index.ts");

if (isDirectExecution) {
  try {
    seed();
    void sql.end();
  } catch (error: unknown) {
    console.error("Erro durante o povoamento:", error);
    void sql.end().then(() => process.exit(1));
  }
}
