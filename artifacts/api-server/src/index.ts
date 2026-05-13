import app from "./app";
import { logger } from "./lib/logger";
import { initWhatsApp } from "./services/whatsapp.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Start WhatsApp connection in the background
  initWhatsApp().catch((e) =>
    logger.error({ err: e }, "WhatsApp init failed")
  );
});
