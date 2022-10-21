import { Server as IOServer, Socket } from 'socket.io';

import {
  ALLOWED_ORIGINS,
  EVENTS,
  PORT,
} from './configuration';
import database from './database';
import signInHandler from './handlers/sign-in.handler';
import log from './utilities/logger';

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
        (payload): Promise<boolean> => signInHandler(socket, payload),
      );
    },
  );

  server.listen(PORT);
  log(`RELAY launched on port ${PORT}`);
}
