import { Router, type IRouter } from "express";
import { db, aiConfigTable, faqsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  UpdateAiConfigBody,
  UpdateFaqParams,
  UpdateFaqBody,
  DeleteFaqParams,
  CreateFaqBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateConfig() {
  const configs = await db.select().from(aiConfigTable).limit(1);
  if (configs.length > 0) return configs[0];
  const [config] = await db
    .insert(aiConfigTable)
    .values({ enabled: true, tone: "friendly", escalationSensitivity: "medium" })
    .returning();
  return config;
}

function formatConfig(c: typeof aiConfigTable.$inferSelect) {
  return {
    ...c,
    confidenceThreshold: parseFloat(c.confidenceThreshold),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/ai/config", async (_req, res): Promise<void> => {
  const config = await getOrCreateConfig();
  res.json(formatConfig(config));
});

router.put("/ai/config", async (req, res): Promise<void> => {
  const parsed = UpdateAiConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const config = await getOrCreateConfig();
  const { confidenceThreshold, ...rest } = parsed.data;
  const data = confidenceThreshold !== undefined
    ? { ...rest, confidenceThreshold: String(confidenceThreshold) }
    : rest;
  const [updated] = await db
    .update(aiConfigTable)
    .set(data)
    .where(eq(aiConfigTable.id, config.id))
    .returning();
  res.json(formatConfig(updated));
});

router.get("/ai/faqs", async (_req, res): Promise<void> => {
  const faqs = await db.select().from(faqsTable);
  res.json(faqs.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/ai/faqs", async (req, res): Promise<void> => {
  const parsed = CreateFaqBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [faq] = await db.insert(faqsTable).values(parsed.data).returning();
  res.status(201).json({ ...faq, createdAt: faq.createdAt.toISOString() });
});

router.patch("/ai/faqs/:id", async (req, res): Promise<void> => {
  const params = UpdateFaqParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFaqBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [faq] = await db
    .update(faqsTable)
    .set(parsed.data)
    .where(eq(faqsTable.id, params.data.id))
    .returning();
  if (!faq) {
    res.status(404).json({ error: "FAQ not found" });
    return;
  }
  res.json({ ...faq, createdAt: faq.createdAt.toISOString() });
});

router.delete("/ai/faqs/:id", async (req, res): Promise<void> => {
  const params = DeleteFaqParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [faq] = await db
    .delete(faqsTable)
    .where(eq(faqsTable.id, params.data.id))
    .returning();
  if (!faq) {
    res.status(404).json({ error: "FAQ not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
