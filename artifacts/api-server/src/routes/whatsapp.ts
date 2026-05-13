import { Router, type IRouter } from "express";
import {
  getWhatsAppState,
  disconnectWhatsApp,
  reconnectWhatsApp,
} from "../services/whatsapp.js";

const router: IRouter = Router();

router.get("/whatsapp/status", async (req, res): Promise<void> => {
  const st = getWhatsAppState();
  res.json({
    connected: st.connected,
    phone: st.phone ?? null,
    sessionActive: st.connected,
    lastConnected: null,
    qrRequired: !st.connected,
  });
});

router.get("/whatsapp/qr", async (req, res): Promise<void> => {
  const st = getWhatsAppState();
  if (st.connected) {
    res.json({ qr: null, expiresAt: null, status: "connected" });
    return;
  }
  if (!st.qrDataUrl) {
    res.json({ qr: null, expiresAt: null, status: "initializing" });
    return;
  }
  const expiresAt = st.qrGeneratedAt
    ? new Date(st.qrGeneratedAt.getTime() + 60_000).toISOString()
    : null;
  res.json({ qr: st.qrDataUrl, expiresAt, status: "pending" });
});

router.post("/whatsapp/disconnect", async (req, res): Promise<void> => {
  await disconnectWhatsApp();
  req.log.info("WhatsApp disconnected");
  res.json({ success: true, message: "Disconnected successfully" });
});

router.post("/whatsapp/reconnect", async (req, res): Promise<void> => {
  reconnectWhatsApp().catch((err) =>
    req.log.error({ err }, "Reconnect error")
  );
  req.log.info("WhatsApp reconnect initiated");
  res.json({ success: true, message: "Reconnecting..." });
});

export default router;
