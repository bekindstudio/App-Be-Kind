import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull().default(""),
  avatarUrl: text("avatar_url"),
  dateOfBirth: text("date_of_birth"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  loyaltyLevel: text("loyalty_level").notNull().default("Bronze"),
  dietaryPreferences: text("dietary_preferences").array().notNull().default([]),
  allergyPreferences: text("allergy_preferences").array().notNull().default([]),
  notificationOrders: boolean("notification_orders").notNull().default(true),
  notificationPromos: boolean("notification_promos").notNull().default(true),
  notificationEvents: boolean("notification_events").notNull().default(true),
  notificationLoyalty: boolean("notification_loyalty").notNull().default(true),
  qrToken: text("qr_token").unique(),
  codiceFiscale: text("codice_fiscale"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  isAdmin: boolean("is_admin").notNull().default(false),
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
