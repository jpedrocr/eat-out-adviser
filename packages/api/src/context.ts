import type { db } from "@eat-out-adviser/db/client";
import type { UserRole } from "@eat-out-adviser/shared";

/**
 * Sessao do utilizador autenticado.
 * Estrutura minima necessaria para identificar a sessao.
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
  db: typeof db;
  session: Session | null;
  userId: string | null;
  userRole: UserRole;
  ip: string;
  userAgent: string;
}

/**
 * Cria o contexto tRPC para um pedido HTTP.
 * Chamada uma vez por pedido pelo adaptador (Next.js, standalone, etc.).
 */
export function createContext(opts: CreateContextOptions): Context {
  return {
    db: opts.db,
    session: opts.session,
    userId: opts.userId,
    userRole: opts.userRole,
    ip: opts.ip,
    userAgent: opts.userAgent,
  };
}
