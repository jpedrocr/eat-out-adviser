/**
 * Cliente Google Gemini para o Eat Out Adviser.
 *
 * Inicializa o SDK `@google/genai` com a chave de API definida
 * na variavel de ambiente GEMINI_API_KEY.
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY nao esta definida nas variaveis de ambiente.");
}

/** Instancia principal do cliente Google Gemini. */
export const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/** Modelos disponiveis para utilizacao na plataforma. */
export const MODELS = {
  /** Gemini 2.5 Pro — raciocinio avancado, analise complexa. */
  pro: "gemini-2.5-pro",
  /** Gemini 2.5 Flash — respostas rapidas, tarefas mais simples. */
  flash: "gemini-2.5-flash",
} as const;

/** Tipo auxiliar para os nomes dos modelos disponiveis. */
export type ModelName = (typeof MODELS)[keyof typeof MODELS];
