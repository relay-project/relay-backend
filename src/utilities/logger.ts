import chalk from 'chalk';
import { Console } from 'console';

import {
  APPLICATION_NAME,
  ENVS,
  NODE_ENV,
} from '../configuration';

const logger = new Console(process.stdout, process.stderr);

function createTimestamp(): string {
  return chalk.dim(chalk.green(`[${APPLICATION_NAME} - ${new Date().toISOString()}]`));
}

export function databaseLog(...message: unknown[]): void {
  if (NODE_ENV === ENVS.development) {
    logger.log(`${createTimestamp()} ${chalk.dim(message)}`);
  }
}

export default function log(...message: unknown[]): void {
  if (NODE_ENV === ENVS.development) {
    logger.log(`${createTimestamp()} ${message}`);
  }
}
