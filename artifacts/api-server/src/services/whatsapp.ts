import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type proto,
} from "@whiskeysockets/baileys";
// @hapi/boom is a transitive dep of baileys — access via type assertion at runtime
type BoomError = { output?: { statusCode?: number } };
import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";
import {
  db,
  whatsappSessionTable,
  customersTable,
  conversationsTable,
  messagesTable,
  aiConfigTable,
  settingsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { generateAIReply, detectEmotion, createUrgentNotification } from "./ai.js";

const AUTH_DIR = "./baileys_auth";

interface WhatsAppState {
  connected: boolean;
  qrDataUrl: string | null;
  phone: string | null;
  qrGeneratedAt: Date | null;
}

let state: WhatsAppState = {
  connected: false,
  qrDataUrl: null,
  phone: null,
  qrGeneratedAt: null,
};

let socket: WASocket | null = null;
let isInitializing = false;
let sessionDbId: number | null = null;

async function getSessionId(): Promise<number> {
  if (sessionDbId) return sessionDbId;
  const sessions = await db.select().from(whatsappSessionTable).limit(1);
  if (sessions.length > 0) {
    sessionDbId = sessions[0].id;
    return sessionDbId;
  }
  const [session] = await db
    .insert(whatsappSessionTable)
    .values({ connected: false })
    .returning();
  sessionDbId = session.id;
  return sessionDbId;
}

async function updateDbState(update: {
  connected: boolean;
  phone?: string | null;
}) {
  try {
    const id = await getSessionId();
    await db
      .update(whatsappSessionTable)
      .set({
        connected: update.connected,
        phone: update.phone ?? null,
        lastConnected: update.connected ? new Date() : undefined,
      })
      .where(eq(whatsappSessionTable.id, id));
  } catch (err) {
    logger.error({ err }, "Failed to update WhatsApp session in DB");
  }
}

async function isAIGloballyEnabled(): Promise<boolean> {
  try {
    const [cfg] = await db.select().from(aiConfigTable).limit(1);
    return cfg?.enabled ?? true;
  } catch {
    return true;
  }
}

async function handleIncomingMessage(
  msg: proto.IWebMessageInfo,
  sock: WASocket
): Promise<void> {
  try {
    const jid = msg.key?.remoteJid;
    if (!jid) return;

    // Skip group messages, status updates, and own messages
    if (jid === "status@broadcast") return;
    if (jid.endsWith("@g.us")) return;
    if (msg.key?.fromMe) return;

    // Extract message text
    const text =
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      msg.message?.buttonsResponseMessage?.selectedDisplayText ??
      msg.message?.listResponseMessage?.title ??
      null;

    if (!text) return;

    const phone = jid.replace("@s.whatsapp.net", "");
    const pushName = msg.pushName ?? null;

    logger.info({ phone, text: text.substring(0, 80) }, "Incoming WhatsApp message");

    // Find or create customer
    let [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.phone, phone));

    if (!customer) {
      [customer] = await db
        .insert(customersTable)
        .values({
          phone,
          name: pushName,
          aiEnabled: true,
          lastSeen: new Date(),
        })
        .returning();
      logger.info({ phone, customerId: customer.id }, "New customer created");
    } else {
      await db
        .update(customersTable)
        .set({
          lastSeen: new Date(),
          name: customer.name ?? pushName ?? undefined,
          totalMessages: customer.totalMessages + 1,
        })
        .where(eq(customersTable.id, customer.id));
    }

    // Find or create open conversation
    let [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.customerId, customer.id),
          eq(conversationsTable.status, "open")
        )
      )
      .orderBy(desc(conversationsTable.updatedAt))
      .limit(1);

    if (!conversation) {
      [conversation] = await db
        .insert(conversationsTable)
        .values({
          customerId: customer.id,
          status: "open",
          aiHandled: true,
          humanTakeover: false,
          aiPaused: false,
          lastMessage: text,
          unreadCount: 1,
        })
        .returning();
      logger.info({ conversationId: conversation.id }, "New conversation created");
    } else {
      await db
        .update(conversationsTable)
        .set({
          lastMessage: text,
          unreadCount: conversation.unreadCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(conversationsTable.id, conversation.id));
    }

    // Detect emotion
    const emotion = await detectEmotion(text);

    // Save incoming message
    await db.insert(messagesTable).values({
      conversationId: conversation.id,
      content: text,
      sender: phone,
      senderType: "customer",
      isAiGenerated: false,
      emotionDetected: emotion,
    });

    // Create notification for negative emotions
    if (emotion === "angry" || emotion === "frustrated") {
      await createUrgentNotification(
        customer.id,
        conversation.id,
        customer.name ?? pushName,
        emotion
      );
    }

    // Determine if AI should reply
    const globalAiEnabled = await isAIGloballyEnabled();
    const shouldReply =
      globalAiEnabled &&
      customer.aiEnabled &&
      !customer.isBlocked &&
      !conversation.humanTakeover &&
      !conversation.aiPaused;

    if (!shouldReply) {
      logger.info(
        { conversationId: conversation.id, globalAiEnabled, customerAiEnabled: customer.aiEnabled },
        "AI reply skipped"
      );
      return;
    }

    // Generate AI reply
    const reply = await generateAIReply({
      conversationId: conversation.id,
      customerId: customer.id,
      customerName: customer.name ?? pushName,
      incomingMessage: text,
    });

    if (!reply) return;

    // Send via WhatsApp
    await sock.sendMessage(jid, { text: reply });

    // Save AI reply to DB
    await db.insert(messagesTable).values({
      conversationId: conversation.id,
      content: reply,
      sender: "ai",
      senderType: "ai",
      isAiGenerated: true,
    });

    // Update conversation
    await db
      .update(conversationsTable)
      .set({
        lastMessage: reply,
        aiHandled: true,
        updatedAt: new Date(),
      })
      .where(eq(conversationsTable.id, conversation.id));

    logger.info({ conversationId: conversation.id }, "AI reply sent");
  } catch (err) {
    logger.error({ err }, "Error handling incoming message");
  }
}

export async function initWhatsApp(): Promise<void> {
  if (isInitializing) return;
  isInitializing = true;
  logger.info("Initializing WhatsApp connection via Baileys...");

  try {
    await mkdir(AUTH_DIR, { recursive: true });
    const { state: authState, saveCreds } =
      await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    logger.info({ version: version.join(".") }, "Using WhatsApp version");

    socket = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      logger: logger.child({ module: "baileys" }) as never,
      browser: ["Nexus AI", "Chrome", "1.0.0"],
      markOnlineOnConnect: false,
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
      if (type !== "notify") return;
      const sock = socket;
      if (!sock) return;
      for (const msg of msgs) {
        await handleIncomingMessage(msg, sock);
      }
    });

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          });
          state = {
            connected: false,
            qrDataUrl: dataUrl,
            phone: null,
            qrGeneratedAt: new Date(),
          };
          logger.info("New WhatsApp QR code generated");
        } catch (err) {
          logger.error({ err }, "Failed to convert QR to data URL");
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as BoomError)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.info(
          { statusCode, shouldReconnect },
          "WhatsApp connection closed"
        );

        state = { connected: false, qrDataUrl: null, phone: null, qrGeneratedAt: null };
        await updateDbState({ connected: false, phone: null });

        socket = null;
        isInitializing = false;

        if (shouldReconnect) {
          logger.info("Reconnecting in 3s...");
          setTimeout(() => initWhatsApp(), 3000);
        } else {
          logger.info("Logged out — clearing auth state");
          const { rm } = await import("node:fs/promises");
          await rm(AUTH_DIR, { recursive: true, force: true });
        }
      } else if (connection === "open") {
        const phone = socket?.user?.id?.split(":")[0] ?? null;
        state = {
          connected: true,
          qrDataUrl: null,
          phone,
          qrGeneratedAt: null,
        };
        logger.info({ phone }, "WhatsApp connected successfully!");
        await updateDbState({ connected: true, phone });
      }
    });

    isInitializing = false;
  } catch (err) {
    isInitializing = false;
    logger.error({ err }, "Failed to initialize WhatsApp");
    setTimeout(() => initWhatsApp(), 5000);
  }
}

export function getWhatsAppState(): WhatsAppState {
  return { ...state };
}

export async function disconnectWhatsApp(): Promise<void> {
  try {
    if (socket) {
      await socket.logout();
    }
  } catch {
    // ignore errors during logout
  } finally {
    socket = null;
    state = { connected: false, qrDataUrl: null, phone: null, qrGeneratedAt: null };
    isInitializing = false;
    await updateDbState({ connected: false, phone: null });
    const { rm } = await import("node:fs/promises");
    await rm(AUTH_DIR, { recursive: true, force: true });
  }
}

export async function reconnectWhatsApp(): Promise<void> {
  if (socket) {
    try {
      socket.end(undefined);
    } catch {
      // ignore
    }
    socket = null;
  }
  state = { connected: false, qrDataUrl: null, phone: null, qrGeneratedAt: null };
  isInitializing = false;
  await initWhatsApp();
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<void> {
  if (!socket || !state.connected) {
    throw new Error("WhatsApp not connected");
  }
  const jid = to.includes("@") ? to : `${to.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
  await socket.sendMessage(jid, { text });
}
