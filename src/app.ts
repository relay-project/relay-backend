import { Server as IOServer, Socket } from 'socket.io';

import {
  ALLOWED_ORIGINS,
  APPLICATION_NAME,
  EVENTS,
  PORT,
} from './configuration';
import database from './database';
import gracefulShutdown from './utilities/graceful-shutdown';
import handleDisconnecting from './utilities/handle-disconnecting';
import log from './utilities/logger';
import redis from './utilities/redis';
import router from './router';

export default async function createServer(): Promise<void> {
  await database.connect();
  await database.registerModels();

  await router.loadHandlers();

  await redis.connect();

  const server = new IOServer({
    cors: {
      credentials: true,
      origin: ALLOWED_ORIGINS,
    },
    serveClient: false,
  });

  server.on(
    EVENTS.CONNECTION,
    (connection: Socket): void => {
      log(`connected ${connection.id}`);

      router.registerHandlers(connection, server);
      connection.on(
        EVENTS.DISCONNECTING,
        (): Promise<void> => handleDisconnecting(connection),
      );
      connection.on(
        EVENTS.DISCONNECT,
        (reason: string): void => log(`disconnected ${connection.id} (${reason})`),
      );
    },
  );

  server.listen(PORT);

  process.on(
    'SIGINT',
    (signal): Promise<void> => gracefulShutdown(signal, server, database, redis),
  );
  process.on(
    'SIGTERM',
    (signal): Promise<void> => gracefulShutdown(signal, server, database, redis),
  );

  log(`${APPLICATION_NAME} launched on port ${PORT}`);
}
