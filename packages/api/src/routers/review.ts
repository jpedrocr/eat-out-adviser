import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, publicProcedure } from "../trpc.js";
import { authenticatedProcedure } from "../middleware/auth.js";

/**
 * Router de avaliacoes.
 * Gere criacao e consulta de avaliacoes de restaurantes.
 */
export const reviewRouter = router({
  /**
   * Cria uma nova avaliacao para um restaurante.
   */
  create: authenticatedProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid("ID de restaurante invalido."),
        foodRating: z.number().int().min(1).max(5),
        serviceRating: z.number().int().min(1).max(5),
        accessibilityRating: z.number().int().min(1).max(5),
        text: z.string().max(5000).nullable().optional(),
        visitDate: z.string().date().nullable().optional(),
        mobilityTypeAtVisit: z
          .enum([
            "electric_wheelchair",
            "manual_wheelchair",
            "walker",
            "crutches",
            "cane",
            "scooter",
            "none",
            "other",
          ])
          .nullable()
          .optional(),
        companionCount: z.number().int().nonnegative().nullable().optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Lista avaliacoes de um restaurante com paginacao.
   */
  list: publicProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid("ID de restaurante invalido."),
        pagination: z
          .object({
            cursor: z.string().optional(),
            limit: z.number().int().min(1).max(50).default(20),
          })
          .optional(),
      }),
    )
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Devolve todas as avaliacoes de um restaurante (sem paginacao).
   */
  getByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string().uuid("ID de restaurante invalido.") }))
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),
});
