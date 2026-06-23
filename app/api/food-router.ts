import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { foodItems } from "@db/schema";
import { eq, desc, like, and } from "drizzle-orm";

export const foodRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          category: z.string().optional(),
          search: z.string().optional(),
          availableOnly: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.category && input.category !== "all") {
        conditions.push(eq(foodItems.category, input.category as "veg" | "non_veg" | "beverage" | "snack" | "dessert"));
      }
      if (input?.search) {
        conditions.push(like(foodItems.name, `%${input.search}%`));
      }
      if (input?.availableOnly) {
        conditions.push(eq(foodItems.isAvailable, 1));
      }

      if (conditions.length > 0) {
        return db
          .select()
          .from(foodItems)
          .where(and(...conditions))
          .orderBy(desc(foodItems.createdAt));
      }

      return db.select().from(foodItems).orderBy(desc(foodItems.createdAt));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(foodItems)
        .where(eq(foodItems.id, input.id))
        .limit(1);
      return rows[0] || null;
    }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        stock: z.number().int().min(0).default(0),
        servingTime: z.string().optional(),
        category: z.enum(["veg", "non_veg", "beverage", "snack", "dessert"]),
        imageUrl: z.string().optional(),
        isAvailable: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const now = new Date().toISOString();
      const result = await db.insert(foodItems).values({
        name: input.name,
        description: input.description || null,
        price: input.price,
        stock: input.stock,
        servingTime: input.servingTime || null,
        category: input.category,
        imageUrl: input.imageUrl || null,
        isAvailable: input.isAvailable ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
      return { id: Number(result.lastInsertRowid) };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0).optional(),
        servingTime: z.string().optional(),
        category: z.enum(["veg", "non_veg", "beverage", "snack", "dessert"]).optional(),
        imageUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.stock !== undefined) updateData.stock = data.stock;
      if (data.servingTime !== undefined) updateData.servingTime = data.servingTime || null;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
      if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable ? 1 : 0;

      await db.update(foodItems).set(updateData).where(eq(foodItems.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(foodItems).where(eq(foodItems.id, input.id));
      return { success: true };
    }),
});
