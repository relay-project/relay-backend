import { Console } from 'console';

import { ENVS, NODE_ENV } from '../configuration';

const logger = new Console(process.stdout, process.stderr);

export default function log(...message: any[]): void {
  if (NODE_ENV === ENVS.development) {
    logger.log(`[RELAY - ${new Date().toISOString()}] ${message}`);
  }
}
