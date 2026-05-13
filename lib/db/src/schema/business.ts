import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessProfileTable = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull().default("My Business"),
  category: text("category").notNull().default("Retail"),
  description: text("description"),
  address: text("address"),
  workingHours: text("working_hours"),
  contactNumber: text("contact_number"),
  deliveryAvailable: boolean("delivery_available").notNull().default(false),
  paymentMethods: text("payment_methods"),
  returnPolicy: text("return_policy"),
  languages: text("languages"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfileTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfileTable.$inferSelect;
