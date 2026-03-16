import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock do modulo auth
vi.mock("@eat-out-adviser/db/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

// Mock do modulo db/client
vi.mock("@eat-out-adviser/db/client", () => ({
  db: {},
}));

import { appRouter } from "../routers/index.js";
import type { Context } from "../context.js";

function createMockContext(overrides: Partial<Context> = {}): Context {
  return {
    db: {} as Context["db"],
    session: null,
    userId: null,
    userRole: "user",
    ip: "127.0.0.1",
    userAgent: "test",
    ...overrides,
  };
}

const caller = (ctx: Context) => appRouter.createCaller(ctx);

describe("isAuthenticated middleware", () => {
  it("bloqueia acesso a procedimentos autenticados sem sessao", async () => {
    const ctx = createMockContext();

    await expect(caller(ctx).user.getProfile()).rejects.toThrow(TRPCError);
    await expect(caller(ctx).user.getProfile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("permite acesso com sessao valida", async () => {
    const session = { id: "s1", userId: "u1", expiresAt: new Date() };
    const ctx = createMockContext({ session, userId: "u1" });

    // user.getProfile lanca NOT_IMPLEMENTED (stub), nao UNAUTHORIZED
    await expect(caller(ctx).user.getProfile()).rejects.toMatchObject({
      code: "NOT_IMPLEMENTED",
    });
  });
});

describe("requireRole middleware", () => {
  it("bloqueia acesso quando role e insuficiente", async () => {
    const session = { id: "s1", userId: "u1", expiresAt: new Date() };
    const ctx = createMockContext({ session, userId: "u1", userRole: "user" });

    // admin.listUsers requer role admin
    await expect(caller(ctx).admin.listUsers()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("permite acesso quando role e suficiente", async () => {
    const session = { id: "s1", userId: "u1", expiresAt: new Date() };
    const ctx = createMockContext({ session, userId: "u1", userRole: "admin" });

    // admin.listUsers lanca NOT_IMPLEMENTED (stub), nao FORBIDDEN
    await expect(caller(ctx).admin.listUsers()).rejects.toMatchObject({
      code: "NOT_IMPLEMENTED",
    });
  });
});
