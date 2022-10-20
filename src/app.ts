import { Server as IOServer } from 'socket.io';

import {
  ALLOWED_ORIGINS,
  PORT,
} from './configuration';
import log from './utilities/logger';

export default function createServer(): void {
  const server = new IOServer({
    cors: {
      credentials: true,
      origin: ALLOWED_ORIGINS,
    },
    serveClient: false,
  });

  server.listen(PORT);
  log(`Launched on port ${PORT}`);
}
