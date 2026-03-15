import { router } from "../trpc.js";
import { adminRouter } from "./admin.js";
import { aiRouter } from "./ai.js";
import { authRouter } from "./auth.js";
import { menuRouter } from "./menu.js";
import { reservationRouter } from "./reservation.js";
import { restaurantRouter } from "./restaurant.js";
import { reviewRouter } from "./review.js";
import { userRouter } from "./user.js";
import { verificationRouter } from "./verification.js";

/**
 * Router principal da aplicacao.
 * Agrega todos os sub-routers por dominio de negocio.
 */
export const appRouter = router({
  admin: adminRouter,
  ai: aiRouter,
  auth: authRouter,
  menu: menuRouter,
  reservation: reservationRouter,
  restaurant: restaurantRouter,
  review: reviewRouter,
  user: userRouter,
  verification: verificationRouter,
});

/** Tipo do router principal, utilizado pelo cliente tRPC para inferencia de tipos. */
export type AppRouter = typeof appRouter;
