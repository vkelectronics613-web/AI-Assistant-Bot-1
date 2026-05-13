import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";
import { db, whatsappSessionTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

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
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
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
          // Clear auth dir so fresh QR is needed
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
    // Retry after 5s
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
    // Clear auth so user gets fresh QR
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
