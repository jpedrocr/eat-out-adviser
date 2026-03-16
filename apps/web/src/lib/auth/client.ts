import { createAuthClient } from "better-auth/react";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/**
 * Cliente Better Auth para o browser.
 * Utilizar em Client Components para sign-in, sign-up, sign-out, e gestao de sessao.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [adminClient(), twoFactorClient(), passkeyClient()],
});

/** Hooks e metodos de conveniencia */
export const { signIn, signUp, signOut, useSession } = authClient;
