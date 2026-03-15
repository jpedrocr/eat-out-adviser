import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Context } from "./context.js";

/**
 * Inicializacao do tRPC com contexto tipado, transformador superjson
 * e formatador de erros que expoe detalhes de validacao Zod.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Cria um router tRPC.
 * Utilizar para agrupar procedimentos por dominio (auth, restaurant, etc.).
 */
export const router = t.router;

/**
 * Procedimento publico — nao requer autenticacao.
 * Ponto de partida para queries e mutations acessiveis a qualquer utilizador.
 */
export const publicProcedure = t.procedure;

/**
 * Middleware tRPC — permite interceptar e transformar o contexto.
 */
export const middleware = t.middleware;

/**
 * Combina varios routers num unico router.
 */
export const mergeRouters = t.mergeRouters;
