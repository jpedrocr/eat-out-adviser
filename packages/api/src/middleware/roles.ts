import { TRPCError } from "@trpc/server";
import type { UserRole } from "@eat-out-adviser/shared";

import { middleware } from "../trpc.js";
import { authenticatedProcedure } from "./auth.js";

/**
 * Hierarquia de papeis — indice mais alto implica mais privilegios.
 * Utilizada para verificar se o papel do utilizador e suficiente.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  owner: 1,
  verifier: 2,
  admin: 3,
};

/**
 * Fabrica de middleware que exige um papel minimo.
 * Compara o papel do utilizador com o papel requerido usando a hierarquia definida.
 * Lanca FORBIDDEN se o utilizador nao tiver privilegios suficientes.
 */
export function requireRole(role: UserRole) {
  return middleware(async ({ ctx, next }) => {
    const userLevel = ROLE_HIERARCHY[ctx.userRole];
    const requiredLevel = ROLE_HIERARCHY[role];

    if (userLevel < requiredLevel) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Acesso restrito. E necessario o papel "${role}" ou superior.`,
      });
    }

    return next({ ctx });
  });
}

/**
 * Procedimento restrito a proprietarios de restaurantes (ou superior).
 */
export const ownerProcedure = authenticatedProcedure.use(requireRole("owner"));

/**
 * Procedimento restrito a verificadores de acessibilidade (ou superior).
 */
export const verifierProcedure = authenticatedProcedure.use(requireRole("verifier"));

/**
 * Procedimento restrito a administradores.
 */
export const adminProcedure = authenticatedProcedure.use(requireRole("admin"));
