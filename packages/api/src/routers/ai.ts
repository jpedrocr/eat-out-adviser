import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, publicProcedure } from "../trpc.js";
import { authenticatedProcedure } from "../middleware/auth.js";

/**
 * Router de funcionalidades de inteligencia artificial.
 * Integra com o Gemini para pesquisa semantica, analise de imagens e chat.
 */
export const aiRouter = router({
  /**
   * Pesquisa semantica de restaurantes usando RAG (Retrieval-Augmented Generation).
   */
  search: authenticatedProcedure
    .input(
      z.object({
        query: z.string().min(1, "A consulta de pesquisa e obrigatoria.").max(500),
      }),
    )
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Analisa uma fotografia para extrair informacao de acessibilidade.
   * Utiliza o Gemini Vision para detectar rampas, degraus, portas, etc.
   */
  analyzePhoto: authenticatedProcedure
    .input(
      z.object({
        imageUrl: z.string().url("URL de imagem invalido."),
        restaurantId: z.string().uuid("ID de restaurante invalido.").optional(),
        context: z.string().max(500).optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Conversa com o assistente de IA sobre restaurantes e acessibilidade.
   */
  chat: authenticatedProcedure
    .input(
      z.object({
        message: z.string().min(1, "A mensagem e obrigatoria.").max(2000),
        conversationId: z.string().uuid().optional(),
      }),
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),

  /**
   * Gera um resumo das avaliacoes de um restaurante usando IA.
   */
  summarizeReviews: publicProcedure
    .input(z.object({ restaurantId: z.string().uuid("ID de restaurante invalido.") }))
    .query(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Em desenvolvimento." });
    }),
});
