import { router, publicProcedure } from "../trpc.js";

/**
 * Router de autenticacao.
 * A autenticacao e gerida pelo Better Auth via /api/auth/[...all].
 * Este router expoe apenas a sessao activa para o cliente tRPC.
 */
export const authRouter = router({
  /**
   * Devolve a sessao activa do utilizador, ou null se nao autenticado.
   */
  getSession: publicProcedure.query(({ ctx }) => ctx.session ?? null),
});
