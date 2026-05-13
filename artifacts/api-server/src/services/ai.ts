import {
  db,
  businessProfileTable,
  faqsTable,
  aiConfigTable,
  productsTable,
  messagesTable,
  conversationsTable,
  notificationsTable,
  customersTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";

interface AIReplyContext {
  conversationId: number;
  customerId: number;
  customerName: string | null;
  incomingMessage: string;
}

export async function generateAIReply(ctx: AIReplyContext): Promise<string | null> {
  try {
    const [business] = await db.select().from(businessProfileTable).limit(1);
    const [aiConfig] = await db.select().from(aiConfigTable).limit(1);
    const faqs = await db.select().from(faqsTable);
    const products = await db.select().from(productsTable).limit(20);

    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, ctx.conversationId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(10);

    const reversedHistory = history.reverse();

    const tone = aiConfig?.tone ?? "friendly";
    const customInstructions = aiConfig?.customInstructions ?? "";
    const businessName = business?.businessName ?? "Our Store";
    const businessDesc = business?.description ?? "";
    const deliveryInfo = business?.deliveryAvailable
      ? "We offer delivery."
      : "We currently do not offer delivery.";
    const workingHours = business?.workingHours ?? "Check with us for hours.";
    const paymentMethods = business?.paymentMethods ?? "";
    const returnPolicy = business?.returnPolicy ?? "";
    const address = business?.address ?? "";

    const productList = products.length > 0
      ? products
          .map((p) => `- ${p.name} (${p.category}): ${p.price} — ${p.description ?? "No description"} [${p.inStock ? "In stock" : "Out of stock"}]`)
          .join("\n")
      : "No products listed.";

    const faqList = faqs.length > 0
      ? faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
      : "";

    const systemPrompt = `You are a helpful customer support assistant for ${businessName}.
${businessDesc ? `About us: ${businessDesc}` : ""}
${address ? `Address: ${address}` : ""}
Working hours: ${workingHours}
${deliveryInfo}
${paymentMethods ? `Payment methods: ${paymentMethods}` : ""}
${returnPolicy ? `Return policy: ${returnPolicy}` : ""}

Tone: Be ${tone} and professional. Keep replies concise (1-3 sentences max unless detail is needed).
Language: Match the customer's language. If they write in Arabic, reply in Arabic. Default to English.

Available products:
${productList}

${faqList ? `Frequently asked questions:\n${faqList}` : ""}

${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

Rules:
- Never make up information not provided above.
- If you cannot answer, politely say a human agent will follow up.
- Do not mention that you are an AI unless directly asked.
- Do not include greetings like "Hello!" in every reply — only on the first message.
- Keep replies short and focused.`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of reversedHistory) {
      if (msg.senderType === "customer") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.senderType === "ai" || msg.senderType === "agent") {
        messages.push({ role: "assistant", content: msg.content });
      }
    }

    messages.push({ role: "user", content: ctx.incomingMessage });

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 500,
      messages,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? null;
    logger.info({ conversationId: ctx.conversationId, reply }, "AI reply generated");
    return reply;
  } catch (err) {
    logger.error({ err }, "Failed to generate AI reply");
    return null;
  }
}

export async function detectEmotion(text: string): Promise<string> {
  const lower = text.toLowerCase();
  if (/angry|furious|terrible|horrible|worst|hate|useless|scam|refund|unacceptable|disgusting/.test(lower)) {
    return "angry";
  }
  if (/unhappy|disappointed|frustrated|not happy|bad experience|slow|delay/.test(lower)) {
    return "frustrated";
  }
  if (/great|excellent|awesome|love|perfect|fantastic|happy|satisfied|thank/.test(lower)) {
    return "happy";
  }
  return "neutral";
}

export async function createUrgentNotification(
  customerId: number,
  conversationId: number,
  customerName: string | null,
  emotion: string,
): Promise<void> {
  try {
    const name = customerName ?? "Unknown customer";
    let title = "";
    let message = "";
    let type = "warning";

    if (emotion === "angry") {
      title = `Angry customer: ${name}`;
      message = `Customer ${name} appears to be very upset. Manual intervention may be needed.`;
      type = "error";
    } else if (emotion === "frustrated") {
      title = `Frustrated customer: ${name}`;
      message = `Customer ${name} seems frustrated. Consider taking over this conversation.`;
      type = "warning";
    } else {
      return;
    }

    await db.insert(notificationsTable).values({
      title,
      message,
      type,
      read: false,
      priority: emotion === "angry" ? "urgent" : "high",
      relatedId: conversationId,
    });

    if (emotion === "angry") {
      await db
        .update(conversationsTable)
        .set({ isUrgent: true, emotionState: emotion })
        .where(eq(conversationsTable.id, conversationId));

      await db
        .update(customersTable)
        .set({ emotionState: emotion })
        .where(eq(customersTable.id, customerId));
    }
  } catch (err) {
    logger.error({ err }, "Failed to create urgent notification");
  }
}
