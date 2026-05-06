import { env } from './config/env.js';
import { buildApp } from './app.js';
import { connectDb, disconnectDb } from './lib/db.js';
import { expireOverdueSessions } from './services/sessions.service.js';

async function main() {
  await connectDb();

  const app = buildApp();
  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    console.log(`[api] escuchando en http://${env.API_HOST}:${env.API_PORT}`);
  });

  const expireTimer = setInterval(async () => {
    try {
      const expired = await expireOverdueSessions();
      if (expired > 0) console.log(`[scheduler] sesiones expiradas: ${expired}`);
    } catch (err) {
      console.error('[scheduler]', err);
    }
  }, 60_000);

  const shutdown = async (signal: string) => {
    console.log(`[api] recibida señal ${signal}, cerrando...`);
    clearInterval(expireTimer);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
