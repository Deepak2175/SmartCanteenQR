import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// OAuth users (from Kimi auth - for admin access)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unionId: text("unionId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().defaultNow(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().defaultNow(),
  lastSignInAt: integer("lastSignInAt", { mode: "timestamp" }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Students - local auth with email/password
export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().defaultNow(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().defaultNow(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// Food items / Menu
export const foodItems = sqliteTable("food_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  servingTime: text("serving_time"),
  category: text("category").notNull().default("veg"),
  imageUrl: text("image_url"),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().defaultNow(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().defaultNow(),
});

export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = typeof foodItems.$inferInsert;

// Orders
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  tokenNumber: integer("token_number").notNull(),
  totalAmount: real("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("upi"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  orderStatus: text("order_status").notNull().default("pending"),
  qrCode: text("qr_code"),
  collectionStatus: integer("collection_status", { mode: "boolean" }).notNull().default(false),
  orderDate: integer("order_date", { mode: "timestamp" }).notNull().defaultNow(),
  collectionDate: integer("collection_date", { mode: "timestamp" }),
  pickupTime: text("pickup_time"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Order items (line items)
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  foodId: integer("food_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// Canteen settings
export const canteenSettings = sqliteTable("canteen_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openingTime: text("opening_time").notNull().default("08:00"),
  closingTime: text("closing_time").notNull().default("20:00"),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
  currentToken: integer("current_token").notNull().default(0),
  lastTokenNumber: integer("last_token_number").notNull().default(100),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().defaultNow(),
});

export type CanteenSettings = typeof canteenSettings.$inferSelect;
export type InsertCanteenSettings = typeof canteenSettings.$inferInsert;

// Cart items (for student session-based cart)
export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  foodId: integer("food_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().defaultNow(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// Student reports (for food/order issues)
export const studentReports = sqliteTable("student_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  orderId: integer("order_id"),
  foodId: integer("food_id"),
  issue: text("issue").notNull(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().defaultNow(),
});

export type StudentReport = typeof studentReports.$inferSelect;
export type InsertStudentReport = typeof studentReports.$inferInsert;
