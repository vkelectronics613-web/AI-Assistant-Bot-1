import { Router, type IRouter } from "express";
import { db, conversationsTable, customersTable, messagesTable } from "@workspace/db";
import { eq, and, ilike, desc, type SQL } from "drizzle-orm";
import {
  ListConversationsQueryParams,
  GetConversationParams,
  TakeoverConversationParams,
  ReturnConversationToAiParams,
  PauseConversationAiParams,
  ResumeConversationAiParams,
  ListMessagesParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatConversation(
  c: typeof conversationsTable.$inferSelect,
  customer?: typeof customersTable.$inferSelect | null,
) {
  return {
    ...c,
    customerPhone: customer?.phone ?? "",
    customerName: customer?.name ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function formatMessage(m: typeof messagesTable.$inferSelect) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/conversations", async (req, res): Promise<void> => {
  const params = ListConversationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const convConditions: SQL[] = [];
  if (params.data.status === "ai") convConditions.push(eq(conversationsTable.aiHandled, true));
  if (params.data.status === "human") convConditions.push(eq(conversationsTable.humanTakeover, true));
  if (params.data.status === "urgent") convConditions.push(eq(conversationsTable.isUrgent, true));
  if (params.data.status === "unread") convConditions.push(eq(conversationsTable.unreadCount, 0));

  const conversations = convConditions.length > 0
    ? await db.select().from(conversationsTable).where(and(...convConditions)).orderBy(desc(conversationsTable.updatedAt))
    : await db.select().from(conversationsTable).orderBy(desc(conversationsTable.updatedAt));

  const customerIds = [...new Set(conversations.map((c) => c.customerId))];
  const customers = customerIds.length > 0
    ? await db.select().from(customersTable).where(
        customerIds.length === 1
          ? eq(customersTable.id, customerIds[0])
          : eq(customersTable.id, customerIds[0])
      )
    : [];

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  let results = conversations.map((c) => formatConversation(c, customerMap.get(c.customerId)));
  if (params.data.search) {
    const q = params.data.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.customerPhone.toLowerCase().includes(q) ||
        (c.customerName?.toLowerCase().includes(q) ?? false),
    );
  }

  res.json(results);
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, conv.customerId));
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conv.id))
    .orderBy(messagesTable.createdAt);
  res.json({
    ...formatConversation(conv, customer),
    messages: messages.map(formatMessage),
  });
});

router.post("/conversations/:id/takeover", async (req, res): Promise<void> => {
  const params = TakeoverConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .update(conversationsTable)
    .set({ humanTakeover: true, aiHandled: false, aiPaused: true })
    .where(eq(conversationsTable.id, params.data.id))
    .returning();
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, conv.customerId));
  res.json(formatConversation(conv, customer));
});

router.post("/conversations/:id/return-to-ai", async (req, res): Promise<void> => {
  const params = ReturnConversationToAiParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .update(conversationsTable)
    .set({ humanTakeover: false, aiHandled: true, aiPaused: false })
    .where(eq(conversationsTable.id, params.data.id))
    .returning();
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, conv.customerId));
  res.json(formatConversation(conv, customer));
});

router.post("/conversations/:id/pause-ai", async (req, res): Promise<void> => {
  const params = PauseConversationAiParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .update(conversationsTable)
    .set({ aiPaused: true })
    .where(eq(conversationsTable.id, params.data.id))
    .returning();
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, conv.customerId));
  res.json(formatConversation(conv, customer));
});

router.post("/conversations/:id/resume-ai", async (req, res): Promise<void> => {
  const params = ResumeConversationAiParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .update(conversationsTable)
    .set({ aiPaused: false })
    .where(eq(conversationsTable.id, params.data.id))
    .returning();
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, conv.customerId));
  res.json(formatConversation(conv, customer));
});

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);
  res.json(messages.map(formatMessage));
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      content: parsed.data.content,
      sender: "agent",
      senderType: "human",
      isAiGenerated: false,
    })
    .returning();
  await db
    .update(conversationsTable)
    .set({ lastMessage: parsed.data.content, updatedAt: new Date() })
    .where(eq(conversationsTable.id, params.data.id));
  res.status(201).json(formatMessage(message));
});

export default router;
