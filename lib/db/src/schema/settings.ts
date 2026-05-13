import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  globalAiEnabled: boolean("global_ai_enabled").notNull().default(true),
  autoHandoverSensitivity: text("auto_handover_sensitivity").notNull().default("medium"),
  responseDelaySeconds: integer("response_delay_seconds").notNull().default(2),
  workingHoursStart: text("working_hours_start").notNull().default("09:00"),
  workingHoursEnd: text("working_hours_end").notNull().default("18:00"),
  autoGreetingMessage: text("auto_greeting_message"),
  autoAwayMessage: text("auto_away_message"),
  language: text("language").notNull().default("en"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;

export const whatsappSessionTable = pgTable("whatsapp_sessions", {
  id: serial("id").primaryKey(),
  connected: boolean("connected").notNull().default(false),
  phone: text("phone"),
  sessionData: text("session_data"),
  lastConnected: timestamp("last_connected", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWhatsappSessionSchema = createInsertSchema(whatsappSessionTable).omit({ id: true, updatedAt: true });
export type InsertWhatsappSession = z.infer<typeof insertWhatsappSessionSchema>;
export type WhatsappSession = typeof whatsappSessionTable.$inferSelect;
