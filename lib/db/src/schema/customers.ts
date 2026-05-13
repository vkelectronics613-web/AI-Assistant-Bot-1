import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  isVip: boolean("is_vip").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  notes: text("notes"),
  emotionState: text("emotion_state").notNull().default("neutral"),
  totalMessages: integer("total_messages").notNull().default(0),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
