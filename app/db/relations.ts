import { relations } from "drizzle-orm";
import { orders, orderItems, foodItems, students, cartItems } from "./schema";

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  foodItem: one(foodItems, {
    fields: [orderItems.foodId],
    references: [foodItems.id],
  }),
}));

export const foodItemsRelations = relations(foodItems, ({ many }) => ({
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  cartItems: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  foodItem: one(foodItems, {
    fields: [cartItems.foodId],
    references: [foodItems.id],
  }),
}));
