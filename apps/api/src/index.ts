import { createApp } from "./app.js";
import { assertRuntimeConfig, env } from "./config/env.js";
import connectDatabase, { prisma } from "./database/neondb.js";

const app = createApp();

async function main(): Promise<void> {
  assertRuntimeConfig();
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    console.log(
      `Offerline API listening on http://localhost:${String(env.PORT)} (${env.NODE_ENV})`,
    );
  });

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down.`);

    const forceExit = setTimeout(() => {
      console.error("Graceful shutdown timed out.");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close((error) => {
      void prisma.$disconnect().finally(() => {
        clearTimeout(forceExit);
        if (error) console.error("HTTP server shutdown failed", error);
        process.exit(error ? 1 : 0);
      });
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
  console.error("Server failed to start", err);
  process.exit(1);
});
