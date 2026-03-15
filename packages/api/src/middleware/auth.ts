import { TRPCError } from "@trpc/server";

import { middleware, publicProcedure } from "../trpc.js";

/**
 * Middleware de autenticacao.
 * Verifica se o utilizador tem sessao activa e userId definido.
 * Lanca UNAUTHORIZED se o utilizador nao estiver autenticado.
 */
export const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tem de iniciar sessao para aceder a este recurso.",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      userId: ctx.userId,
    },
  });
});

/**
 * Procedimento protegido — requer autenticacao.
 * O contexto garante que session e userId estao definidos (non-null).
 */
export const authenticatedProcedure = publicProcedure.use(isAuthenticated);
