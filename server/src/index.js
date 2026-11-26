import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

const server = app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`QuickBite API listening on port ${config.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
