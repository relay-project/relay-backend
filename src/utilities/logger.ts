import { Console } from 'console';

import {
  APPLICATION_NAME,
  ENVS,
  NODE_ENV,
} from '../configuration';

const logger = new Console(process.stdout, process.stderr);

export default function log(...message: any[]): void {
  if (NODE_ENV === ENVS.development) {
    logger.log(`[${APPLICATION_NAME} - ${new Date().toISOString()}] ${message}`);
  }
}
