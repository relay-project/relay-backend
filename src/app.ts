import { Server as IOServer, Socket } from 'socket.io';

import {
  ALLOWED_ORIGINS,
  EVENTS,
  PORT,
} from './configuration';
import database from './database';
import gracefulShutdown from './utilities/graceful-shutdown';
import log from './utilities/logger';
import router from './router';

export default async function createServer(): Promise<void> {
  await database.connect();
  await database.registerModels();

  const server = new IOServer({
    cors: {
      credentials: true,
      origin: ALLOWED_ORIGINS,
    },
    serveClient: false,
  });

  server.on(
    EVENTS.CONNECTION,
    (socket: Socket): void => {
      log(`connected ${socket.id}`);

      router(socket);
      socket.on(
        EVENTS.DISCONNECT,
        (reason: string): void => log(`disconnected ${socket.id} (${reason})`),
      );
    },
  );

  server.listen(PORT);

  process.on(
    'SIGINT',
    (signal): Promise<void> => gracefulShutdown(signal, server, database),
  );
  process.on(
    'SIGTERM',
    (signal): Promise<void> => gracefulShutdown(signal, server, database),
  );

  log(`RELAY launched on port ${PORT}`);
}
