import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListNotificationsQueryParams,
  MarkNotificationReadParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res): Promise<void> => {
  const params = ListNotificationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const notifications = params.data.unreadOnly
    ? await db.select().from(notificationsTable).where(eq(notificationsTable.read, false)).orderBy(desc(notificationsTable.createdAt))
    : await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));
  res.json(notifications.map(formatNotification));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [notification] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(formatNotification(notification));
});

router.post("/notifications/read-all", async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ read: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
