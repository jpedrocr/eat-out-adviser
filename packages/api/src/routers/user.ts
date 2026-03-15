import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router } from "../trpc.js";
import { authenticatedProcedure } from "../middleware/auth.js";

/**
 * Router de utilizador.
 * Gere perfil pessoal e perfil de acessibilidade.
 */
export const userRouter = router({
  /**
   * Devolve o perfil do utilizador autenticado.
   */
  getProfile: authenticatedProcedure.query(() => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
  }),

  /**
   * Actualiza o perfil pessoal do utilizador.
   */
  updateProfile: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").optional(),
        locale: z.enum(["pt", "en"]).optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Devolve o perfil de acessibilidade pessoal do utilizador.
   */
  getAccessibilityProfile: authenticatedProcedure.query(() => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
  }),

  /**
   * Actualiza o perfil de acessibilidade pessoal do utilizador.
   * Os campos sao todos opcionais para permitir actualizacoes parciais.
   */
  updateAccessibilityProfile: authenticatedProcedure
    .input(
      z.object({
        mobilityType: z
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
          .optional(),
        wheelchairWidth: z.number().positive().nullable().optional(),
        wheelchairLength: z.number().positive().nullable().optional(),
        turningRadiusNeeded: z.number().positive().nullable().optional(),
        maxRampIncline: z.number().positive().nullable().optional(),
        maxStepHeight: z.number().nonnegative().nullable().optional(),
        needsElevator: z.boolean().optional(),
        needsAccessibleBathroom: z.boolean().optional(),
        bathroomTransferSide: z.enum(["left", "right", "both", "not_applicable"]).optional(),
        doorOpeningForceLimit: z.number().positive().nullable().optional(),
        companionCount: z.number().int().nonnegative().nullable().optional(),
        dietaryRestrictions: z.array(z.string()).nullable().optional(),
        allergies: z.array(z.string()).nullable().optional(),
        preferredCuisines: z.array(z.string()).nullable().optional(),
        maxDistanceFromParking: z.number().positive().nullable().optional(),
        otherNeeds: z.string().nullable().optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),
});
