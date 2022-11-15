import type { Server } from 'socket.io';

import Database from '../database';
import log from './logger';
import RedisInstance from './redis';

export default async function gracefulShutdown(
  signal: string,
  server: Server,
  database: typeof Database,
  redis: typeof RedisInstance,
): Promise<void> {
  await database.disconnect();
  await redis.disconnect();
  server.close();

  log(`gracefully stopped the server [${signal}]`);
  return process.exit(0);
}
