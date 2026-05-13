import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  status: text("status").notNull().default("open"),
  aiHandled: boolean("ai_handled").notNull().default(true),
  humanTakeover: boolean("human_takeover").notNull().default(false),
  aiPaused: boolean("ai_paused").notNull().default(false),
  emotionState: text("emotion_state").notNull().default("neutral"),
  lastMessage: text("last_message"),
  unreadCount: integer("unread_count").notNull().default(0),
  isUrgent: boolean("is_urgent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
