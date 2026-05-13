import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length > 0) return rows[0];
  const [settings] = await db
    .insert(settingsTable)
    .values({
      globalAiEnabled: true,
      autoHandoverSensitivity: "medium",
      responseDelaySeconds: 2,
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      autoGreetingMessage: "Hello! How can I help you today?",
      autoAwayMessage: "We are currently away. We will get back to you during working hours.",
      language: "en",
    })
    .returning();
  return settings;
}

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    ...s,
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(formatSettings(settings));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const settings = await getOrCreateSettings();
  const [updated] = await db
    .update(settingsTable)
    .set(parsed.data)
    .where(eq(settingsTable.id, settings.id))
    .returning();
  res.json(formatSettings(updated));
});

export default router;
