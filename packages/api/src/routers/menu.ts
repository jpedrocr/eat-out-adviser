import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, publicProcedure } from "../trpc.js";
import { ownerProcedure } from "../middleware/roles.js";

/**
 * Router de ementas.
 * Gere consulta e actualizacao de ementas de restaurantes.
 */
export const menuRouter = router({
  /**
   * Devolve a ementa de um restaurante.
   */
  getByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string().uuid("ID de restaurante invalido.") }))
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Actualiza a ementa de um restaurante. Restrito ao proprietario.
   */
  updateMenu: ownerProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid("ID de restaurante invalido."),
        sections: z.array(
          z.object({
            name: z.string().min(1, "O nome da seccao e obrigatorio."),
            items: z.array(
              z.object({
                name: z.string().min(1, "O nome do item e obrigatorio."),
                description: z.string().nullable().optional(),
                price: z.number().nonnegative().nullable().optional(),
                allergens: z.array(z.string()).nullable().optional(),
                isAccessible: z.boolean().optional(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),
});
