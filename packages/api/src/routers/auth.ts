import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, publicProcedure } from "../trpc.js";
import { authenticatedProcedure } from "../middleware/auth.js";

/**
 * Router de autenticacao.
 * Gere registo, login, logout e consulta de sessao.
 */
export const authRouter = router({
  /**
   * Regista um novo utilizador na plataforma.
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Endereco de email invalido."),
        name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
        password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Inicia sessao com email e palavra-passe.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Endereco de email invalido."),
        password: z.string().min(1, "A palavra-passe e obrigatoria."),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Termina a sessao activa do utilizador.
   */
  logout: authenticatedProcedure.mutation(() => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
  }),

  /**
   * Devolve a sessao activa do utilizador, ou null se nao autenticado.
   */
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session ?? null;
  }),
});
