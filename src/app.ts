import { Server as IOServer, Socket } from 'socket.io';

import {
  ALLOWED_ORIGINS,
  EVENTS,
  PORT,
} from './configuration';
import database from './database';
import gracefulShutdown from './utilities/graceful-shutdown';
import log from './utilities/logger';
import signInHandler from './handlers/auth/sign-in.handler';
import signUpHandler from './handlers/auth/sign-up.handler';

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

      socket.on(
        EVENTS.DISCONNECT,
        (reason: string): void => log(`disconnected ${socket.id} (${reason})`),
      );
      socket.on(
        EVENTS.SIGN_IN,
        (payload): Promise<boolean> => signInHandler(
          socket,
          payload,
          EVENTS.SIGN_IN,
        ),
      );
      socket.on(
        EVENTS.SIGN_UP,
        (payload): Promise<boolean> => signUpHandler(
          socket,
          payload,
          EVENTS.SIGN_UP,
        ),
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
