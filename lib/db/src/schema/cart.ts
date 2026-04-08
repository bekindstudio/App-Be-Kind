import { pgTable, text, serial, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cartItemsTable = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  dishId: integer("dish_id").notNull(),
  dishName: text("dish_name").notNull(),
  dishPrice: doublePrecision("dish_price").notNull(),
  imageUrl: text("image_url"),
  quantity: integer("quantity").notNull().default(1),
  customizations: text("customizations"),
});

export const shopCartItemsTable = pgTable("shop_cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productPrice: doublePrecision("product_price").notNull(),
  imageUrl: text("image_url"),
  quantity: integer("quantity").notNull().default(1),
  selectedVariants: jsonb("selected_variants"),
});

export const insertCartItemSchema = createInsertSchema(cartItemsTable).omit({ id: true });
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItemsTable.$inferSelect;

export const insertShopCartItemSchema = createInsertSchema(shopCartItemsTable).omit({ id: true });
export type InsertShopCartItem = z.infer<typeof insertShopCartItemSchema>;
export type ShopCartItem = typeof shopCartItemsTable.$inferSelect;
