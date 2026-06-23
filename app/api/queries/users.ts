import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
  }

  const existing = await findUserByUnionId(values.unionId);
  if (existing) {
    await getDb()
      .update(schema.users)
      .set({ lastSignInAt: new Date().toISOString(), name: values.name, avatar: values.avatar, role: values.role })
      .where(eq(schema.users.unionId, values.unionId));
  } else {
    await getDb()
      .insert(schema.users)
      .values(values);
  }
}
