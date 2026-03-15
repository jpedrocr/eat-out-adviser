import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, publicProcedure } from "../trpc.js";
import { verifierProcedure, adminProcedure } from "../middleware/roles.js";

/**
 * Router de verificacao de acessibilidade.
 * Gere submissao, aprovacao e rejeicao de verificacoes.
 */
export const verificationRouter = router({
  /**
   * Submete uma verificacao de acessibilidade para um restaurante.
   * Restrito a verificadores certificados.
   */
  submit: verifierProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid("ID de restaurante invalido."),
        notes: z.string().max(5000).optional(),
        photoUrls: z.array(z.string().url()).optional(),
        accessibilityData: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Aprova uma verificacao submetida. Restrito a administradores.
   */
  approve: adminProcedure
    .input(
      z.object({
        verificationId: z.string().uuid("ID de verificacao invalido."),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Rejeita uma verificacao submetida. Restrito a administradores.
   */
  reject: adminProcedure
    .input(
      z.object({
        verificationId: z.string().uuid("ID de verificacao invalido."),
        reason: z.string().min(1, "O motivo da rejeicao e obrigatorio.").max(1000),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Devolve o historico de verificacoes de um restaurante.
   */
  getHistory: publicProcedure
    .input(z.object({ restaurantId: z.string().uuid("ID de restaurante invalido.") }))
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),
});
