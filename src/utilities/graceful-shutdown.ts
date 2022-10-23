import type { Server } from 'socket.io';

import type Database from '../database';
import log from './logger';

export default async function gracefulShutdown(
  signal: string,
  server: Server,
  database: typeof Database,
): Promise<void> {
  await database.disconnect();
  server.close();

  log(`gracefully stopped the server [${signal}]`);
  return process.exit(0);
}
