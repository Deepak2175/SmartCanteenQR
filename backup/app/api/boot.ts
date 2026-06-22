import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { setCookie } from "hono/cookie";
import type { HttpBindings } from "@hono/node-server";
import { eq } from "drizzle-orm";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { signSessionToken } from "./kimi/session";
import { getSessionCookieOptions } from "./lib/cookies";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { Paths, Session } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Dev admin login — bypasses OAuth when Kimi server is not available
app.get("/api/dev-login", async (c) => {
  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.unionId, env.ownerUnionId)).limit(1);
  if (!existing) {
    await db.insert(users).values({ unionId: env.ownerUnionId, name: "Admin", role: "admin" });
  }
  const token = await signSessionToken({ unionId: env.ownerUnionId, clientId: env.appId });
  const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
  setCookie(c, Session.cookieName, token, { ...cookieOpts, maxAge: Session.maxAgeMs / 1000 });
  return c.redirect("/admin", 302);
});
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
