import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { canteenSettings } from "@db/schema";
import { eq } from "drizzle-orm";

export const canteenRouter = createRouter({
  getSettings: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(canteenSettings).limit(1);

    if (rows.length === 0) {
      await db.insert(canteenSettings).values({
        openingTime: "08:00",
        closingTime: "20:00",
        isOpen: 1,
        currentToken: 0,
        lastTokenNumber: 100,
        crowdLevel: "low",
        updatedAt: new Date().toISOString(),
      });
      const newRows = await db.select().from(canteenSettings).limit(1);
      return newRows[0];
    }

    return rows[0];
  }),

  updateSettings: adminQuery
    .input(
      z.object({
        openingTime: z.string().optional(),
        closingTime: z.string().optional(),
        isOpen: z.boolean().optional(),
        crowdLevel: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(canteenSettings).limit(1);

      if (rows.length === 0) {
        const now = new Date().toISOString();
        await db.insert(canteenSettings).values({
          openingTime: input.openingTime || "08:00",
          closingTime: input.closingTime || "20:00",
          isOpen: input.isOpen === undefined ? 1 : (input.isOpen ? 1 : 0),
          currentToken: 0,
          lastTokenNumber: 100,
          crowdLevel: input.crowdLevel || "low",
          updatedAt: now,
        });
      } else {
        const updateData: Record<string, unknown> = {};
        if (input.openingTime !== undefined) updateData.openingTime = input.openingTime;
        if (input.closingTime !== undefined) updateData.closingTime = input.closingTime;
        if (input.isOpen !== undefined) updateData.isOpen = input.isOpen ? 1 : 0;
        if (input.crowdLevel !== undefined) updateData.crowdLevel = input.crowdLevel;
        updateData.updatedAt = new Date().toISOString();

        await db
          .update(canteenSettings)
          .set(updateData)
          .where(eq(canteenSettings.id, rows[0].id));
      }

      return { success: true };
    }),

  resetToken: adminQuery.mutation(async () => {
    const db = getDb();
    const rows = await db.select().from(canteenSettings).limit(1);

    if (rows.length > 0) {
      await db
        .update(canteenSettings)
        .set({ currentToken: 0, lastTokenNumber: 100 })
        .where(eq(canteenSettings.id, rows[0].id));
    }

    return { success: true };
  }),
});
