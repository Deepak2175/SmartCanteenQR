import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { canteenSettings } from "@db/schema";
import { eq } from "drizzle-orm";

export const canteenRouter = createRouter({
  getSettings: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(canteenSettings).limit(1);

    if (rows.length === 0) {
      // Create default settings
      await db.insert(canteenSettings).values({
        openingTime: "08:00",
        closingTime: "20:00",
        isOpen: true,
        currentToken: 0,
        lastTokenNumber: 100,
      });
      const newRows = await db.select().from(canteenSettings).limit(1);
      return newRows[0];
    }

    // Auto-check opening hours
    const settings = rows[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const shouldBeOpen = currentTime >= settings.openingTime && currentTime <= settings.closingTime;

    if (settings.isOpen !== shouldBeOpen) {
      await db
        .update(canteenSettings)
        .set({ isOpen: shouldBeOpen })
        .where(eq(canteenSettings.id, settings.id));
      settings.isOpen = shouldBeOpen;
    }

    return settings;
  }),

  updateSettings: publicQuery
    .input(
      z.object({
        openingTime: z.string().optional(),
        closingTime: z.string().optional(),
        isOpen: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(canteenSettings).limit(1);

      if (rows.length === 0) {
        await db.insert(canteenSettings).values({
          openingTime: input.openingTime || "08:00",
          closingTime: input.closingTime || "20:00",
          isOpen: input.isOpen ?? true,
          currentToken: 0,
          lastTokenNumber: 100,
        });
      } else {
        const updateData: Record<string, unknown> = {};
        if (input.openingTime !== undefined) updateData.openingTime = input.openingTime;
        if (input.closingTime !== undefined) updateData.closingTime = input.closingTime;
        if (input.isOpen !== undefined) updateData.isOpen = input.isOpen;

        await db
          .update(canteenSettings)
          .set(updateData)
          .where(eq(canteenSettings.id, rows[0].id));
      }

      return { success: true };
    }),

  resetToken: publicQuery.mutation(async () => {
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
