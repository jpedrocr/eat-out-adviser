import { describe, it, expect, vi } from "vitest";

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

describe("authRouter", () => {
  it("getSession devolve null quando nao autenticado", async () => {
    const ctx = createMockContext();
    const result = await caller(ctx).auth.getSession();

    expect(result).toBeNull();
  });

  it("getSession devolve a sessao quando autenticado", async () => {
    const session = {
      id: "sess-1",
      userId: "user-1",
      expiresAt: new Date("2026-12-31"),
    };
    const ctx = createMockContext({ session, userId: "user-1" });
    const result = await caller(ctx).auth.getSession();

    expect(result).toEqual(session);
  });
});
