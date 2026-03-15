import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router } from "../trpc.js";
import { adminProcedure } from "../middleware/roles.js";

/**
 * Router de administracao.
 * Funcionalidades restritas a administradores da plataforma.
 */
export const adminRouter = router({
  /**
   * Lista todos os utilizadores da plataforma com paginacao.
   */
  listUsers: adminProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(100).default(50),
          role: z.enum(["user", "owner", "verifier", "admin"]).optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Modera uma avaliacao (aprovar, sinalizar ou remover).
   */
  moderateReview: adminProcedure
    .input(
      z.object({
        reviewId: z.string().uuid("ID de avaliacao invalido."),
        action: z.enum(["approve", "flag", "remove"]),
        reason: z.string().max(1000).optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Devolve estatisticas gerais da plataforma.
   */
  stats: adminProcedure.query(() => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
  }),
});
