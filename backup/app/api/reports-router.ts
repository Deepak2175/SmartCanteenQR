import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, foodItems, studentReports } from "@db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { verifyStudentToken } from "./student-auth-router";

export const reportsRouter = createRouter({
  reportIssue: publicQuery
    .input(
      z.object({
        orderId: z.number().optional(),
        foodId: z.number().optional(),
        issue: z.string().min(3, "Please describe the issue"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = ctx.req.headers.get("x-student-token");
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const claim = verifyStudentToken(token);
      if (!claim) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = getDb();
      await db.insert(studentReports).values({
        studentId: claim.studentId,
        orderId: input.orderId ?? null,
        foodId: input.foodId ?? null,
        issue: input.issue,
        description: input.description ?? null,
      });
      return { success: true };
    }),

  myReports: publicQuery.query(async ({ ctx }) => {
    const token = ctx.req.headers.get("x-student-token");
    if (!token) return [];
    const claim = verifyStudentToken(token);
    if (!claim) return [];
    const db = getDb();
    return db
      .select()
      .from(studentReports)
      .where(eq(studentReports.studentId, claim.studentId))
      .orderBy(desc(studentReports.createdAt));
  }),
  salesByDate: publicQuery.query(async () => {
    const db = getDb();
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"));

    const salesByDate: Record<string, { date: string; sales: number; orders: number }> = {};

    for (const order of allOrders) {
      const date = new Date(order.orderDate).toISOString().split("T")[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, sales: 0, orders: 0 };
      }
      salesByDate[date].sales += Number(order.totalAmount);
      salesByDate[date].orders += 1;
    }

    return Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));
  }),

  salesByCategory: publicQuery.query(async () => {
    const db = getDb();

    const allOrderItems = await db
      .select({
        orderItem: orderItems,
        foodItem: foodItems,
      })
      .from(orderItems)
      .innerJoin(foodItems, eq(orderItems.foodId, foodItems.id));

    const categorySales: Record<string, { category: string; sales: number; quantity: number }> = {};

    for (const item of allOrderItems) {
      const cat = item.foodItem.category;
      if (!categorySales[cat]) {
        categorySales[cat] = { category: cat, sales: 0, quantity: 0 };
      }
      categorySales[cat].sales += Number(item.orderItem.unitPrice) * item.orderItem.quantity;
      categorySales[cat].quantity += item.orderItem.quantity;
    }

    return Object.values(categorySales);
  }),

  topSellingItems: publicQuery.query(async () => {
    const db = getDb();

    const items = await db
      .select({
        foodName: foodItems.name,
        category: foodItems.category,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalSales: sql<number>`SUM(${orderItems.quantity} * ${orderItems.unitPrice})`,
      })
      .from(orderItems)
      .innerJoin(foodItems, eq(orderItems.foodId, foodItems.id))
      .groupBy(foodItems.id)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    return items;
  }),

  dashboardStats: publicQuery.query(async () => {
    const db = getDb();

    const allOrders = await db.select().from(orders);
    const paidOrders = allOrders.filter((o) => o.paymentStatus === "paid");

    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Today's orders
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = allOrders.filter(
      (o) => new Date(o.orderDate).toISOString().split("T")[0] === today
    );
    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Pending orders
    const pendingOrders = allOrders.filter((o) => o.orderStatus === "pending" || o.orderStatus === "preparing").length;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      todayRevenue,
      todayOrders: todayOrders.length,
      pendingOrders,
    };
  }),
});
