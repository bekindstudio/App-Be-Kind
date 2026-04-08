import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loyaltyTransactionsTable = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  points: integer("points").notNull(),
  type: text("type").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userStampsTable = pgTable("user_stamps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stampId: text("stamp_id").notNull(),
  awardedBy: integer("awarded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactionsTable).omit({ id: true, createdAt: true });
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactionsTable.$inferSelect;

export const insertUserStampSchema = createInsertSchema(userStampsTable).omit({ id: true, createdAt: true });
export type InsertUserStamp = z.infer<typeof insertUserStampSchema>;
export type UserStamp = typeof userStampsTable.$inferSelect;
