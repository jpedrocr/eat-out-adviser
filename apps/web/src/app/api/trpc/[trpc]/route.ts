import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@eat-out-adviser/api";
import { createContext } from "@eat-out-adviser/api/context";
import { db } from "@eat-out-adviser/db/client";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        db,
        session: null,
        userId: null,
        userRole: "user",
        ip: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
      }),
  });

export { handler as GET, handler as POST };
