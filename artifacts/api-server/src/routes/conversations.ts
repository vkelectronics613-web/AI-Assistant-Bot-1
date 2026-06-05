import { Router, type IRouter } from "express";
import { db, conversationsTable, customersTable, messagesTable } from "@workspace/db";
import { eq, and, desc, inArray, type SQL } from "drizzle-orm";
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
import { sendWhatsAppMessage, sendWhatsAppListMessage, getWhatsAppState } from "../services/whatsapp.js";

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
          : inArray(customersTable.id, customerIds)
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

  // Mark conversation as read
  if (conv.unreadCount > 0) {
    await db
      .update(conversationsTable)
      .set({ unreadCount: 0 })
      .where(eq(conversationsTable.id, conv.id));
  }

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

  // Get customer phone for sending via WhatsApp
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

  // Send via WhatsApp if connected
  const waState = getWhatsAppState();
  if (waState.connected && customer?.phone) {
    try {
      await sendWhatsAppMessage(customer.phone, parsed.data.content);
    } catch (err) {
      req.log.warn({ err }, "Failed to send message via WhatsApp — saved to DB only");
    }
  }

  res.status(201).json(formatMessage(message));
});

interface ListOption { title: string; description: string; }

router.post("/conversations/:id/list-message", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { title, body, options } = req.body as { title?: string; body?: string; options?: ListOption[] };
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" }); return;
  }
  if (!Array.isArray(options) || options.length === 0 || options.length > 10) {
    res.status(400).json({ error: "options must be an array of 1–10 items" }); return;
  }
  const cleanOpts = options
    .filter((o): o is ListOption => typeof o?.title === "string" && o.title.trim().length > 0)
    .map((o) => ({ title: o.title.trim(), description: (o.description ?? "").trim() }));
  if (!cleanOpts.length) { res.status(400).json({ error: "At least one option with a title is required" }); return; }

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, conv.customerId));
  if (!customer?.phone) { res.status(422).json({ error: "No phone for customer" }); return; }

  const waState = getWhatsAppState();
  if (!waState.connected) { res.status(503).json({ error: "WhatsApp not connected" }); return; }

  try {
    await sendWhatsAppListMessage(customer.phone, title.trim(), body?.trim() || "Choose an option:", cleanOpts);

    const content = `📋 ${title.trim()}\n${cleanOpts.map((o, i) => `${i + 1}. ${o.title}`).join("\n")}`;
    const [msg] = await db.insert(messagesTable).values({
      conversationId: params.data.id,
      content,
      sender: "agent",
      senderType: "human",
      isAiGenerated: false,
    }).returning();

    await db.update(conversationsTable)
      .set({ lastMessage: `List: ${title.trim()}`, updatedAt: new Date() })
      .where(eq(conversationsTable.id, params.data.id));

    res.status(201).json(formatMessage(msg));
  } catch (err) {
    req.log.error({ err }, "Failed to send list message via WhatsApp");
    res.status(500).json({ error: "Failed to send list message" });
  }
});

export default router;
