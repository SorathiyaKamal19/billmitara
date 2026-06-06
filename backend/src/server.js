import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { registerSocket } from './config/socket.js';

async function bootstrap() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientOrigin, credentials: true }
  });
  registerSocket(io);
  server.listen(env.port, () => console.log(`POSS API running on http://localhost:${env.port}`));
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
