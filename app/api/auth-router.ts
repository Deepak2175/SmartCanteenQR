import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./kimi/session";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { createRouter, authedQuery, publicQuery } from "./middleware";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    const clearCookie = (httpOnly: boolean) => {
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, "", {
          httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: 0,
        }),
      );
    };
    clearCookie(true);
    clearCookie(false);
    return { success: true };
  }),
  adminLogin: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Admin credentials not configured",
        });
      }
      if (input.email !== ADMIN_EMAIL || input.password !== ADMIN_PASSWORD) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const db = getDb();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      const unionId = existing?.unionId ?? `admin_${Date.now()}`;

      if (!existing) {
        const now = new Date().toISOString();
        await db.insert(users).values({
          unionId,
          name: "Admin",
          email: input.email,
          role: "admin",
          createdAt: now,
          updatedAt: now,
          lastSignInAt: now,
        });
      }

      const token = await signSessionToken({ unionId, clientId: env.appId });
      const opts = getSessionCookieOptions(ctx.req.headers);
      const setCookie = (httpOnly: boolean) => {
        ctx.resHeaders.append(
          "set-cookie",
          cookie.serialize(Session.cookieName, token, {
            httpOnly,
            path: opts.path,
            sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
            secure: opts.secure,
            maxAge: 86400,
          }),
        );
      };
      setCookie(true);
      setCookie(false);

      return { success: true };
    }),
});
