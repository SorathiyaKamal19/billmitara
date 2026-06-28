import http from 'http';
import { Server } from 'socket.io';
import { corsOrigin, createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { registerSocket } from './config/socket.js';
import { startKeepAliveCron } from './services/keepAliveService.js';
import { startSupportReminderCron } from './services/supportReminderService.js';
import { ensureSuperadmin } from './services/superadminService.js';

async function bootstrap() {
  await connectDB();
  if (env.seed.createSuperadminOnStart) {
    const superadmin = await ensureSuperadmin();
    console.log(`Superadmin ready on startup: ${superadmin.email}`);
  }
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: corsOrigin, credentials: true }
  });
  registerSocket(io);
  server.listen(env.port, () => {
    console.log(`POSS API running on http://localhost:${env.port}`);
    startKeepAliveCron();
    startSupportReminderCron();
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
