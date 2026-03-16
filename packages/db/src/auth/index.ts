import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

import { db } from "../client";
import * as schema from "../schema";

/**
 * Instancia central do Better Auth para toda a aplicacao.
 *
 * Configuracao:
 * - Drizzle adapter com PostgreSQL (tabelas em snake_case plural)
 * - Email/password + Google OAuth + Apple OAuth
 * - Plugins: admin (RBAC), twoFactor (2FA TOTP), passkey (WebAuthn)
 *
 * Exportada via subpath "@eat-out-adviser/db/auth".
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),

  // --- Autenticacao email/password ---
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // --- Providers OAuth ---
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
    ...(process.env.APPLE_CLIENT_ID && {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET!,
      },
    }),
  },

  // --- Mapeamento de campos ---
  user: {
    fields: {
      image: "avatar_url",
    },
    additionalFields: {
      locale: {
        type: "string",
        defaultValue: "pt",
        input: false,
      },
    },
  },

  // --- Plugins ---
  plugins: [
    admin({
      defaultRole: "user",
    }),
    twoFactor({
      issuer: "Eat Out Adviser",
    }),
    passkey({
      rpID: process.env.PASSKEY_RP_ID ?? "localhost",
      rpName: "Eat Out Adviser",
      origin: process.env.PASSKEY_ORIGIN ?? "http://localhost:3000",
    }),
  ],

  // --- Seguranca ---
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  // --- Performance ---
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutos
    },
  },
});

/** Tipo inferido da sessao Better Auth (inclui user com role, etc.) */
export type BetterAuthSession = typeof auth.$Infer.Session;
