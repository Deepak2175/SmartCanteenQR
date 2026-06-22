import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, foodItems, cartItems, canteenSettings, students } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifyStudentToken } from "./student-auth-router";
import QRCode from "qrcode";

async function getStudentFromCtx(ctx: { req: Request }) {
  const token = ctx.req.headers.get("x-student-token");
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student login required" });
  const claim = verifyStudentToken(token);
  if (!claim) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
  return claim.studentId;
}

export const orderRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        paymentMethod: z.enum(["upi", "card", "cash"]),
        pickupTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const studentId = await getStudentFromCtx(ctx);
      const db = getDb();

      // Get cart items
      const cart = await db
        .select({
          cartItem: cartItems,
          foodItem: foodItems,
        })
        .from(cartItems)
        .innerJoin(foodItems, eq(cartItems.foodId, foodItems.id))
        .where(eq(cartItems.studentId, studentId));

      if (cart.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
      }

      // Validate stock
      for (const item of cart) {
        if (!item.foodItem.isAvailable || item.foodItem.stock < item.cartItem.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${item.foodItem.name} is out of stock or unavailable`,
          });
        }
      }

      // Calculate total
      const totalAmount = cart.reduce(
        (sum, item) => sum + Number(item.foodItem.price) * item.cartItem.quantity,
        0
      );

      // Get next token number
      const settingsRows = await db.select().from(canteenSettings).limit(1);
      let settings = settingsRows[0];
      if (!settings) {
        await db.insert(canteenSettings).values({
          openingTime: "08:00",
          closingTime: "20:00",
          isOpen: true,
          currentToken: 0,
          lastTokenNumber: 100,
        });
        const newSettings = await db.select().from(canteenSettings).limit(1);
        settings = newSettings[0];
      }

      const tokenNumber = (settings?.lastTokenNumber || 100) + 1;
      await db
        .update(canteenSettings)
        .set({ lastTokenNumber: tokenNumber })
        .where(eq(canteenSettings.id, settings!.id));

      // Create order
      const orderResult = await db.insert(orders).values({
        studentId,
        tokenNumber,
        totalAmount: totalAmount,
        paymentMethod: input.paymentMethod,
        paymentStatus: "paid",
        orderStatus: "preparing",
        pickupTime: input.pickupTime || null,
        collectionStatus: false,
      });

      const orderId = Number(orderResult.lastInsertRowid);

      // Create order items
      for (const item of cart) {
        await db.insert(orderItems).values({
          orderId,
          foodId: item.foodItem.id,
          quantity: item.cartItem.quantity,
          unitPrice: item.foodItem.price,
        });

        // Decrement stock
        await db
          .update(foodItems)
          .set({ stock: item.foodItem.stock - item.cartItem.quantity })
          .where(eq(foodItems.id, item.foodItem.id));
      }

      // Generate QR code
      const qrData = JSON.stringify({
        orderId,
        studentId,
        tokenNumber,
        timestamp: Date.now(),
      });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      await db
        .update(orders)
        .set({ qrCode: qrCodeDataUrl })
        .where(eq(orders.id, orderId));

      // Clear cart
      await db.delete(cartItems).where(eq(cartItems.studentId, studentId));

      return {
        orderId,
        tokenNumber,
        totalAmount,
        qrCode: qrCodeDataUrl,
      };
    }),

  myOrders: publicQuery.query(async ({ ctx }) => {
    const studentId = await getStudentFromCtx(ctx);
    const db = getDb();

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.studentId, studentId))
      .orderBy(desc(orders.orderDate));

    const result = [];
    for (const order of orderRows) {
      const items = await db
        .select({
          orderItem: orderItems,
          foodItem: foodItems,
        })
        .from(orderItems)
        .innerJoin(foodItems, eq(orderItems.foodId, foodItems.id))
        .where(eq(orderItems.orderId, order.id));

      result.push({
        ...order,
        items: items.map((item) => ({
          id: item.orderItem.id,
          foodName: item.foodItem.name,
          quantity: item.orderItem.quantity,
          unitPrice: item.orderItem.unitPrice,
        })),
      });
    }

    return result;
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const studentId = await getStudentFromCtx(ctx);
      const db = getDb();

      const orderRows = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.id), eq(orders.studentId, studentId)))
        .limit(1);

      if (orderRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      const order = orderRows[0];
      const items = await db
        .select({
          orderItem: orderItems,
          foodItem: foodItems,
        })
        .from(orderItems)
        .innerJoin(foodItems, eq(orderItems.foodId, foodItems.id))
        .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        items: items.map((item) => ({
          id: item.orderItem.id,
          foodName: item.foodItem.name,
          quantity: item.orderItem.quantity,
          unitPrice: item.orderItem.unitPrice,
        })),
      };
    }),

  // Admin: list all orders
  list: publicQuery
    .input(
      z
        .object({
          status: z.string().optional(),
          date: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.status && input.status !== "all") {
        conditions.push(eq(orders.orderStatus, input.status as "pending" | "preparing" | "ready" | "collected" | "cancelled"));
      }

      if (conditions.length > 0) {
        return db
          .select()
          .from(orders)
          .where(and(...conditions))
          .orderBy(desc(orders.orderDate));
      }

      return db.select().from(orders).orderBy(desc(orders.orderDate));
    }),

  // Admin: update order status
  updateStatus: publicQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "preparing", "ready", "collected", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = { orderStatus: input.status };
      if (input.status === "collected") {
        updateData.collectionStatus = true;
        updateData.collectionDate = new Date();
      }
      await db.update(orders).set(updateData).where(eq(orders.id, input.id));
      return { success: true };
    }),

  // Scan QR and verify
  scanQr: publicQuery
    .input(z.object({ qrData: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const data = JSON.parse(input.qrData);
        const orderId = data.orderId;

        const db = getDb();
        const orderRows = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (orderRows.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid QR code" });
        }

        const order = orderRows[0];

        if (order.collectionStatus) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Order already collected" });
        }

        if (order.orderStatus === "cancelled") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Order was cancelled" });
        }

        // Get student info
        const studentRows = await db
          .select()
          .from(students)
          .where(eq(students.id, order.studentId))
          .limit(1);

        const student = studentRows[0];

        // Get order items
        const items = await db
          .select({
            orderItem: orderItems,
            foodItem: foodItems,
          })
          .from(orderItems)
          .innerJoin(foodItems, eq(orderItems.foodId, foodItems.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          valid: true,
          order: {
            ...order,
            studentName: student?.name || "Unknown",
            studentEmail: student?.email || "",
            studentPhone: student?.phone || "",
            items: items.map((item) => ({
              foodName: item.foodItem.name,
              quantity: item.orderItem.quantity,
              unitPrice: item.orderItem.unitPrice,
            })),
          },
        };
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid QR code format" });
      }
    }),

  // Mark as collected from QR scan
  markCollected: publicQuery
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const orderRows = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (orderRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      const order = orderRows[0];

      if (order.collectionStatus) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already collected" });
      }

      // Update current token
      const settingsRows = await db.select().from(canteenSettings).limit(1);
      if (settingsRows.length > 0) {
        await db
          .update(canteenSettings)
          .set({ currentToken: order.tokenNumber })
          .where(eq(canteenSettings.id, settingsRows[0].id));
      }

      await db
        .update(orders)
        .set({
          orderStatus: "collected",
          collectionStatus: true,
          collectionDate: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      return { success: true, tokenNumber: order.tokenNumber };
    }),

  // Get order statistics
  stats: publicQuery.query(async () => {
    const db = getDb();
    const allOrders = await db.select().from(orders);

    const totalSales = allOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o) => o.orderStatus === "pending").length;
    const preparingOrders = allOrders.filter((o) => o.orderStatus === "preparing").length;
    const readyOrders = allOrders.filter((o) => o.orderStatus === "ready").length;
    const collectedOrders = allOrders.filter((o) => o.orderStatus === "collected").length;

    return {
      totalSales,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      collectedOrders,
    };
  }),
});
