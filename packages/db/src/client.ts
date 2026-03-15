import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

/**
 * URL de ligacao a base de dados PostgreSQL.
 * Deve ser definida como variavel de ambiente DATABASE_URL.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "A variavel de ambiente DATABASE_URL nao esta definida. Defina-a antes de iniciar a aplicacao.",
  );
}

/**
 * Cliente PostgreSQL (postgres.js).
 * Utilizado directamente para queries raw quando necessario.
 */
export const sql = postgres(connectionString);

/**
 * Instancia Drizzle ORM com esquema completo.
 * Permite queries type-safe com relacoes.
 */
export const db = drizzle(sql, { schema });
