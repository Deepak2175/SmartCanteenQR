import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { cartItems, foodItems } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { verifyStudentToken } from "./student-auth-router";

async function getStudentFromCtx(ctx: { req: Request }) {
  const token = ctx.req.headers.get("x-student-token");
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student login required" });
  const claim = verifyStudentToken(token);
  if (!claim) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
  return claim.studentId;
}

export const cartRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const studentId = await getStudentFromCtx(ctx);
    const db = getDb();

    const items = await db
      .select({
        cartItem: cartItems,
        foodItem: foodItems,
      })
      .from(cartItems)
      .innerJoin(foodItems, eq(cartItems.foodId, foodItems.id))
      .where(eq(cartItems.studentId, studentId));

    return items.map((item) => ({
      cartItemId: item.cartItem.id,
      foodId: item.foodItem.id,
      name: item.foodItem.name,
      description: item.foodItem.description,
      price: item.foodItem.price,
      imageUrl: item.foodItem.imageUrl,
      category: item.foodItem.category,
      quantity: item.cartItem.quantity,
      isAvailable: item.foodItem.isAvailable,
      stock: item.foodItem.stock,
    }));
  }),

  add: publicQuery
    .input(z.object({ foodId: z.number(), quantity: z.number().int().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      const studentId = await getStudentFromCtx(ctx);
      const db = getDb();

      // Check if food exists and has stock
      const foodRows = await db
        .select()
        .from(foodItems)
        .where(eq(foodItems.id, input.foodId))
        .limit(1);

      if (foodRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Food item not found" });
      }

      const food = foodRows[0];
      if (!food.isAvailable || food.stock <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Item is currently unavailable" });
      }

      // Check if already in cart
      const existing = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.studentId, studentId), eq(cartItems.foodId, input.foodId)))
        .limit(1);

      if (existing.length > 0) {
        const newQty = existing[0].quantity + input.quantity;
        if (newQty > food.stock) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Only ${food.stock} items available` });
        }
        await db
          .update(cartItems)
          .set({ quantity: newQty })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        if (input.quantity > food.stock) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Only ${food.stock} items available` });
        }
        await db.insert(cartItems).values({
          studentId,
          foodId: input.foodId,
          quantity: input.quantity,
          createdAt: new Date().toISOString(),
        });
      }

      return { success: true };
    }),

  updateQuantity: publicQuery
    .input(z.object({ cartItemId: z.number(), quantity: z.number().int().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const studentId = await getStudentFromCtx(ctx);
      const db = getDb();

      const rows = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.id, input.cartItemId), eq(cartItems.studentId, studentId)))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cart item not found" });
      }

      await db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(eq(cartItems.id, input.cartItemId));

      return { success: true };
    }),

  remove: publicQuery
    .input(z.object({ cartItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const studentId = await getStudentFromCtx(ctx);
      const db = getDb();

      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, input.cartItemId), eq(cartItems.studentId, studentId)));

      return { success: true };
    }),

  clear: publicQuery.mutation(async ({ ctx }) => {
    const studentId = await getStudentFromCtx(ctx);
    const db = getDb();
    await db.delete(cartItems).where(eq(cartItems.studentId, studentId));
    return { success: true };
  }),
});
