import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do modulo auth antes de importar context
vi.mock("@eat-out-adviser/db/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock do modulo db/client
vi.mock("@eat-out-adviser/db/client", () => ({
  db: {},
}));

import { createContext } from "../context.js";
import { auth } from "@eat-out-adviser/db/auth";

const mockGetSession = vi.mocked(auth.api.getSession);

const baseOpts = {
  headers: new Headers(),
  ip: "127.0.0.1",
  userAgent: "test-agent",
};

describe("createContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devolve sessao null quando nao ha cookie de sessao", async () => {
    mockGetSession.mockResolvedValue(null);

    const ctx = await createContext(baseOpts);

    expect(ctx.session).toBeNull();
    expect(ctx.userId).toBeNull();
    expect(ctx.userRole).toBe("user");
  });

  it("resolve sessao e userId quando autenticado", async () => {
    const expiresAt = new Date("2026-12-31T00:00:00Z");
    mockGetSession.mockResolvedValue({
      session: {
        id: "sess-1",
        userId: "user-1",
        expiresAt,
        token: "tok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      user: {
        id: "user-1",
        name: "Teste",
        email: "teste@example.com",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
      },
    } as never);

    const ctx = await createContext(baseOpts);

    expect(ctx.session).toEqual({
      id: "sess-1",
      userId: "user-1",
      expiresAt,
    });
    expect(ctx.userId).toBe("user-1");
    expect(ctx.userRole).toBe("user");
  });

  it("mapeia role do utilizador correctamente", async () => {
    mockGetSession.mockResolvedValue({
      session: {
        id: "sess-2",
        userId: "admin-1",
        expiresAt: new Date(),
        token: "tok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      user: {
        id: "admin-1",
        name: "Admin",
        email: "admin@example.com",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "admin",
        banned: false,
        banReason: null,
        banExpires: null,
      },
    } as never);

    const ctx = await createContext(baseOpts);

    expect(ctx.userRole).toBe("admin");
  });

  it("usa role 'user' como fallback para roles invalidos", async () => {
    mockGetSession.mockResolvedValue({
      session: {
        id: "sess-3",
        userId: "user-3",
        expiresAt: new Date(),
        token: "tok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      user: {
        id: "user-3",
        name: "User",
        email: "user@example.com",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "invalid_role",
        banned: false,
        banReason: null,
        banExpires: null,
      },
    } as never);

    const ctx = await createContext(baseOpts);

    expect(ctx.userRole).toBe("user");
  });

  it("trata erros de getSession graciosamente (fallback para nao-autenticado)", async () => {
    mockGetSession.mockRejectedValue(new Error("DB indisponivel"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const ctx = await createContext(baseOpts);

    expect(ctx.session).toBeNull();
    expect(ctx.userId).toBeNull();
    expect(ctx.userRole).toBe("user");
    expect(warnSpy).toHaveBeenCalledWith("[tRPC context] Falha ao resolver sessao Better Auth");

    warnSpy.mockRestore();
  });

  it("passa ip e userAgent do pedido para o contexto", async () => {
    mockGetSession.mockResolvedValue(null);

    const ctx = await createContext({
      headers: new Headers(),
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    });

    expect(ctx.ip).toBe("192.168.1.1");
    expect(ctx.userAgent).toBe("Mozilla/5.0");
  });
});
