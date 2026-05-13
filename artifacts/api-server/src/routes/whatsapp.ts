import { Router, type IRouter } from "express";
import { db, whatsappSessionTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreateSession() {
  const sessions = await db.select().from(whatsappSessionTable).limit(1);
  if (sessions.length > 0) return sessions[0];
  const [session] = await db.insert(whatsappSessionTable).values({ connected: false }).returning();
  return session;
}

router.get("/whatsapp/status", async (req, res): Promise<void> => {
  const session = await getOrCreateSession();
  res.json({
    connected: session.connected,
    phone: session.phone ?? null,
    sessionActive: session.connected,
    lastConnected: session.lastConnected?.toISOString() ?? null,
    qrRequired: !session.connected,
  });
});

router.get("/whatsapp/qr", async (req, res): Promise<void> => {
  const session = await getOrCreateSession();
  if (session.connected) {
    res.json({ qr: null, expiresAt: null, status: "connected" });
    return;
  }
  // Simulate a QR code as a data URL placeholder
  const fakeQr = "data:image/svg+xml;base64," + Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="50" height="50" fill="black"/>
      <rect x="20" y="20" width="30" height="30" fill="white"/>
      <rect x="25" y="25" width="20" height="20" fill="black"/>
      <rect x="140" y="10" width="50" height="50" fill="black"/>
      <rect x="150" y="20" width="30" height="30" fill="white"/>
      <rect x="155" y="25" width="20" height="20" fill="black"/>
      <rect x="10" y="140" width="50" height="50" fill="black"/>
      <rect x="20" y="150" width="30" height="30" fill="white"/>
      <rect x="25" y="155" width="20" height="20" fill="black"/>
      <rect x="70" y="10" width="10" height="10" fill="black"/>
      <rect x="90" y="10" width="10" height="10" fill="black"/>
      <rect x="110" y="10" width="10" height="10" fill="black"/>
      <rect x="70" y="30" width="10" height="10" fill="black"/>
      <rect x="80" y="40" width="10" height="10" fill="black"/>
      <rect x="100" y="40" width="10" height="10" fill="black"/>
      <rect x="70" y="70" width="10" height="10" fill="black"/>
      <rect x="90" y="70" width="10" height="10" fill="black"/>
      <rect x="110" y="70" width="10" height="10" fill="black"/>
      <rect x="70" y="90" width="10" height="10" fill="black"/>
      <rect x="80" y="100" width="10" height="10" fill="black"/>
      <rect x="100" y="100" width="10" height="10" fill="black"/>
      <rect x="70" y="120" width="10" height="10" fill="black"/>
      <rect x="90" y="120" width="10" height="10" fill="black"/>
      <rect x="110" y="120" width="10" height="10" fill="black"/>
      <rect x="70" y="140" width="10" height="10" fill="black"/>
      <rect x="80" y="150" width="10" height="10" fill="black"/>
      <rect x="100" y="150" width="10" height="10" fill="black"/>
      <rect x="130" y="70" width="10" height="10" fill="black"/>
      <rect x="150" y="70" width="10" height="10" fill="black"/>
      <rect x="170" y="70" width="10" height="10" fill="black"/>
      <rect x="130" y="90" width="10" height="10" fill="black"/>
      <rect x="140" y="100" width="10" height="10" fill="black"/>
      <rect x="160" y="100" width="10" height="10" fill="black"/>
      <rect x="130" y="120" width="10" height="10" fill="black"/>
      <rect x="150" y="120" width="10" height="10" fill="black"/>
      <rect x="170" y="120" width="10" height="10" fill="black"/>
      <rect x="130" y="140" width="10" height="10" fill="black"/>
      <rect x="140" y="150" width="10" height="10" fill="black"/>
      <rect x="160" y="150" width="10" height="10" fill="black"/>
    </svg>
  `).toString("base64");
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  res.json({ qr: fakeQr, expiresAt, status: "pending" });
});

router.post("/whatsapp/disconnect", async (req, res): Promise<void> => {
  const session = await getOrCreateSession();
  await db
    .update(whatsappSessionTable)
    .set({ connected: false, phone: null, sessionData: null })
    .where(eq(whatsappSessionTable.id, session.id));
  req.log.info("WhatsApp disconnected");
  res.json({ success: true, message: "Disconnected successfully" });
});

router.post("/whatsapp/reconnect", async (req, res): Promise<void> => {
  const session = await getOrCreateSession();
  await db
    .update(whatsappSessionTable)
    .set({ connected: false })
    .where(eq(whatsappSessionTable.id, session.id));
  req.log.info("WhatsApp reconnect initiated");
  res.json({ success: true, message: "Reconnecting..." });
});

export default router;
