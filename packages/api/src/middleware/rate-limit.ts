import { TRPCError } from "@trpc/server";

import { middleware } from "../trpc.js";

/**
 * Entrada do registo de rate limiting por IP.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Armazena contagens de pedidos por IP em memoria.
 * Nota: esta implementacao e adequada para instancia unica.
 * Para producao com multiplas instancias, utilizar Redis ou similar.
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Opcoes de configuracao do rate limiter.
 */
interface RateLimitOptions {
  /** Numero maximo de pedidos permitidos na janela temporal. */
  maxRequests: number;
  /** Duracao da janela temporal em milissegundos. */
  windowMs: number;
}

/**
 * Fabrica de middleware de rate limiting baseado em IP.
 * Utiliza um Map em memoria para registar pedidos por endereco IP.
 * Lanca TOO_MANY_REQUESTS quando o limite e excedido.
 */
export function rateLimit({ maxRequests, windowMs }: RateLimitOptions) {
  return middleware(async ({ ctx, next }) => {
    const key = ctx.ip;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now >= entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next({ ctx });
    }

    if (entry.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Demasiados pedidos. Tente novamente mais tarde.",
      });
    }

    entry.count += 1;
    return next({ ctx });
  });
}
