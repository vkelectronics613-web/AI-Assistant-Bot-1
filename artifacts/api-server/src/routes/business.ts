import { Router, type IRouter } from "express";
import { db, businessProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateBusinessProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateProfile() {
  const profiles = await db.select().from(businessProfileTable).limit(1);
  if (profiles.length > 0) return profiles[0];
  const [profile] = await db
    .insert(businessProfileTable)
    .values({
      businessName: "My Shop",
      category: "Retail",
      deliveryAvailable: false,
    })
    .returning();
  return profile;
}

router.get("/business", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

router.put("/business", async (req, res): Promise<void> => {
  const parsed = UpdateBusinessProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = await getOrCreateProfile();
  const [updated] = await db
    .update(businessProfileTable)
    .set(parsed.data)
    .where(eq(businessProfileTable.id, profile.id))
    .returning();
  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
