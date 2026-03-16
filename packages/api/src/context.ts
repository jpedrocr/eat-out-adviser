import { db } from "@eat-out-adviser/db/client";
import { auth } from "@eat-out-adviser/db/auth";
import type { UserRole } from "@eat-out-adviser/shared";

/** Roles validos para guard runtime. */
const VALID_ROLES: readonly UserRole[] = ["user", "owner", "verifier", "admin"];

/**
 * Sessao do utilizador autenticado.
 * Projeccao minima da sessao Better Auth para uso no contexto tRPC.
 */
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

/**
 * Contexto partilhado por todos os procedimentos tRPC.
 * Criado uma vez por pedido e injectado automaticamente em cada resolver.
 */
export interface Context {
  /** Instancia Drizzle ORM ligada a base de dados. */
  db: typeof db;
  /** Sessao activa do utilizador, ou null se nao autenticado. */
  session: Session | null;
  /** ID do utilizador autenticado, ou null. */
  userId: string | null;
  /** Papel do utilizador na plataforma. */
  userRole: UserRole;
  /** Endereco IP do pedido (para rate limiting). */
  ip: string;
  /** User-Agent do cliente HTTP. */
  userAgent: string;
}

/**
 * Opcoes necessarias para criar o contexto do pedido.
 */
export interface CreateContextOptions {
  /** Headers HTTP do pedido (para resolver a sessao via Better Auth). */
  headers: Headers;
  /** Endereco IP do cliente. */
  ip: string;
  /** User-Agent do cliente. */
  userAgent: string;
}

/**
 * Cria o contexto tRPC para um pedido HTTP.
 * Resolve a sessao do utilizador via Better Auth e mapeia o role para UserRole.
 */
export async function createContext(opts: CreateContextOptions): Promise<Context> {
  let session: Session | null = null;
  let userId: string | null = null;
  let userRole: UserRole = "user";

  try {
    const betterAuthSession = await auth.api.getSession({
      headers: opts.headers,
    });

    if (betterAuthSession) {
      session = {
        id: betterAuthSession.session.id,
        userId: betterAuthSession.session.userId,
        expiresAt: betterAuthSession.session.expiresAt,
      };
      userId = betterAuthSession.user.id;

      // Guard runtime: garantir que o role e valido
      const rawRole = betterAuthSession.user.role as string | undefined;
      if (rawRole && VALID_ROLES.includes(rawRole as UserRole)) {
        userRole = rawRole as UserRole;
      }
    }
  } catch {
    // Falha na resolucao da sessao (ex.: DB indisponivel).
    // Continuar como nao-autenticado em vez de propagar erro 500.
    console.warn("[tRPC context] Falha ao resolver sessao Better Auth");
  }

  return {
    db,
    session,
    userId,
    userRole,
    ip: opts.ip,
    userAgent: opts.userAgent,
  };
}
