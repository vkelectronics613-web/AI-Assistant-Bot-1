import { pgTable, text, serial, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiConfigTable = pgTable("ai_configs", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  tone: text("tone").notNull().default("friendly"),
  customInstructions: text("custom_instructions"),
  confidenceThreshold: numeric("confidence_threshold", { precision: 3, scale: 2 }).notNull().default("0.75"),
  escalationSensitivity: text("escalation_sensitivity").notNull().default("medium"),
  promptPreview: text("prompt_preview"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAiConfigSchema = createInsertSchema(aiConfigTable).omit({ id: true, updatedAt: true });
export type InsertAiConfig = z.infer<typeof insertAiConfigSchema>;
export type AiConfig = typeof aiConfigTable.$inferSelect;

export const faqsTable = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFaqSchema = createInsertSchema(faqsTable).omit({ id: true, createdAt: true });
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqsTable.$inferSelect;
