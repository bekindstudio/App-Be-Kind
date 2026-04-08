import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  type: text("type").notNull(), // delivery | takeaway
  status: text("status").notNull().default("received"), // received | preparing | ready | delivering | delivered | cancelled
  subtotal: doublePrecision("subtotal").notNull(),
  deliveryCost: doublePrecision("delivery_cost").notNull().default(0),
  total: doublePrecision("total").notNull(),
  deliveryAddress: text("delivery_address"),
  pickupTime: text("pickup_time"),
  estimatedDeliveryTime: integer("estimated_delivery_time"),
  notes: text("notes"),
  discountCode: text("discount_code"),
  codiceFiscale: text("codice_fiscale"),
  billingName: text("billing_name"),
  billingAddress: text("billing_address"),
  paymentMethod: text("payment_method"),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  dishId: integer("dish_id").notNull(),
  dishName: text("dish_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  customizations: text("customizations"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
