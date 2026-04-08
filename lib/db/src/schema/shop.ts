import { pgTable, text, serial, timestamp, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopOrdersTable = pgTable("shop_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("confirmed"), // pending | confirmed | shipped | delivered | cancelled
  subtotal: doublePrecision("subtotal").notNull(),
  shippingCost: doublePrecision("shipping_cost").notNull().default(0),
  total: doublePrecision("total").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  trackingNumber: text("tracking_number"),
  pointsEarned: integer("points_earned").notNull().default(0),
  discountCode: text("discount_code"),
  codiceFiscale: text("codice_fiscale"),
  billingName: text("billing_name"),
  billingAddress: text("billing_address"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const shopOrderItemsTable = pgTable("shop_order_items", {
  id: serial("id").primaryKey(),
  shopOrderId: integer("shop_order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  selectedVariants: jsonb("selected_variants"),
});

export const insertShopOrderSchema = createInsertSchema(shopOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShopOrder = z.infer<typeof insertShopOrderSchema>;
export type ShopOrder = typeof shopOrdersTable.$inferSelect;

export const insertShopOrderItemSchema = createInsertSchema(shopOrderItemsTable).omit({ id: true });
export type InsertShopOrderItem = z.infer<typeof insertShopOrderItemSchema>;
export type ShopOrderItem = typeof shopOrderItemsTable.$inferSelect;
