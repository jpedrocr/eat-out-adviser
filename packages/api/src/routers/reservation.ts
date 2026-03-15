import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router } from "../trpc.js";
import { authenticatedProcedure } from "../middleware/auth.js";

/**
 * Router de reservas.
 * Gere criacao, cancelamento e listagem de reservas.
 */
export const reservationRouter = router({
  /**
   * Cria uma nova reserva num restaurante.
   */
  create: authenticatedProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid("ID de restaurante invalido."),
        date: z.string().date("Data invalida."),
        time: z.string().regex(/^\d{2}:\d{2}$/, "Hora invalida. Use o formato HH:MM."),
        partySize: z.number().int().min(1).max(20),
        accessibilityNeeds: z.string().nullable().optional(),
        notes: z.string().max(1000).nullable().optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Cancela uma reserva existente do utilizador autenticado.
   */
  cancel: authenticatedProcedure
    .input(z.object({ reservationId: z.string().uuid("ID de reserva invalido.") }))
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Lista todas as reservas do utilizador autenticado.
   */
  list: authenticatedProcedure.query(() => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
  }),
});
