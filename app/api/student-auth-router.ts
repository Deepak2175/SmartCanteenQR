import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { students } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./lib/env";

const JWT_SECRET = env.appSecret;

function signStudentToken(studentId: number, email: string): string {
  return jwt.sign({ studentId, email, type: "student" }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export function verifyStudentToken(token: string): { studentId: number; email: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      studentId: number;
      email: string;
      type: string;
    };
    if (payload.type !== "student") return null;
    return { studentId: payload.studentId, email: payload.email };
  } catch {
    return null;
  }
}

export const studentAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        phone: z.string().optional(),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(students)
        .where(eq(students.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const now = new Date().toISOString();
      const result = await db.insert(students).values({
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      const studentId = Number(result.lastInsertRowid);
      const token = signStudentToken(studentId, input.email);

      return {
        token,
        student: {
          id: studentId,
          name: input.name,
          email: input.email,
          phone: input.phone,
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(students)
        .where(eq(students.email, input.email))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid email or password",
        });
      }

      const student = rows[0];
      const valid = await bcrypt.compare(input.password, student.password);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const token = signStudentToken(student.id, student.email);
      return {
        token,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-student-token");
    if (!authHeader) return null;

    const claim = verifyStudentToken(authHeader);
    if (!claim) return null;

    const db = getDb();
    const rows = await db
      .select()
      .from(students)
      .where(eq(students.id, claim.studentId))
      .limit(1);

    if (rows.length === 0) return null;

    const student = rows[0];
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
    };
  }),
});
