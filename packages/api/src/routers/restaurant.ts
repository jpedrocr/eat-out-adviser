import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, publicProcedure } from "../trpc.js";
import { ownerProcedure } from "../middleware/roles.js";

/**
 * Router de restaurantes.
 * Gere consulta, pesquisa, criacao e actualizacao de restaurantes.
 */
export const restaurantRouter = router({
  /**
   * Devolve um restaurante pelo seu slug unico.
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1, "O slug e obrigatorio.") }))
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Pesquisa restaurantes com filtros e paginacao.
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        filters: z
          .object({
            city: z.string().optional(),
            district: z.string().optional(),
            cuisineTypes: z.array(z.string()).optional(),
            priceRange: z.enum(["budget", "moderate", "upscale", "fine_dining"]).optional(),
            minAccessibilityScore: z.number().min(0).max(100).optional(),
            hasAccessibleEntrance: z.boolean().optional(),
            hasAccessibleBathroom: z.boolean().optional(),
            hasAccessibleParking: z.boolean().optional(),
          })
          .optional(),
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
   * Pesquisa restaurantes proximos de uma coordenada geografica.
   */
  nearby: publicProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radius: z.number().positive().max(50000).default(5000),
      }),
    )
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Cria um novo restaurante. Restrito a proprietarios.
   */
  create: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1, "O nome e obrigatorio."),
        address: z.string().min(1, "A morada e obrigatoria."),
        city: z.string().min(1, "A cidade e obrigatoria."),
        postalCode: z.string().min(1, "O codigo postal e obrigatorio."),
        country: z.string().default("PT"),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        phone: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        website: z.string().url().nullable().optional(),
        cuisineTypes: z.array(z.string()).nullable().optional(),
        priceRange: z.enum(["budget", "moderate", "upscale", "fine_dining"]).nullable().optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Actualiza os dados de um restaurante existente. Restrito ao proprietario.
   */
  update: ownerProcedure
    .input(
      z.object({
        id: z.string().uuid("ID de restaurante invalido."),
        name: z.string().min(1).optional(),
        address: z.string().min(1).optional(),
        city: z.string().min(1).optional(),
        postalCode: z.string().min(1).optional(),
        phone: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        website: z.string().url().nullable().optional(),
        cuisineTypes: z.array(z.string()).nullable().optional(),
        priceRange: z.enum(["budget", "moderate", "upscale", "fine_dining"]).nullable().optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),
});
