import { authRouter } from "./auth-router";
import { studentAuthRouter } from "./student-auth-router";
import { foodRouter } from "./food-router";
import { cartRouter } from "./cart-router";
import { orderRouter } from "./order-router";
import { canteenRouter } from "./canteen-router";
import { paymentRouter } from "./payment-router";
import { reportsRouter } from "./reports-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  studentAuth: studentAuthRouter,
  food: foodRouter,
  cart: cartRouter,
  order: orderRouter,
  canteen: canteenRouter,
  payment: paymentRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
