import { readdir } from 'node:fs/promises';
import type { Socket } from 'socket.io';

import authorizationDecorator from '../decorators/authorization.decorator';
import calculateOffset from '../utilities/calculate-offset';
import type { HandlerData, Payload } from '../types';
import log from '../utilities/logger';

interface ImportedHandler {
  authorize?: boolean;
  checkAdmin?: boolean;
  event: string;
  handler: (data: HandlerData) => Promise<boolean>;
  paginated?: boolean;
}

type PreparedHandler = Required<ImportedHandler>;

class Router {
  handlers: PreparedHandler[];

  constructor() {
    this.handlers = [];
  }

  async loadHandlers(): Promise<(void | void[])[] | void> {
    const path = `${process.cwd()}/build/handlers`;
    const directories = await readdir(path);
    if (directories.length === 0) {
      return log('handlers not found');
    }

    return Promise.all(directories.map(async (directory: string): Promise<void | void[]> => {
      const directoryPath = `${path}/${directory}`;
      const files = await readdir(directoryPath);
      const handlers = files.filter(
        (name: string): boolean => name.includes('handler') && !name.includes('map'),
      );
      if (handlers.length === 0) {
        return log(`${directory} does not have any handlers`);
      }

      return Promise.all(handlers.map(async (name: string): Promise<void> => {
        const {
          authorize = false,
          checkAdmin = false,
          event,
          handler,
          paginated = false,
        }: ImportedHandler = await import(`${directoryPath}/${name}`);
        if (!(event && handler)) {
          throw new Error(`Invalid handler [${name} / ${event}] structure!`);
        }
        log(`- loaded handler: ${event}`);
        this.handlers.push({
          authorize,
          checkAdmin,
          event,
          handler,
          paginated,
        });
      }));
    }));
  }

  registerHandlers(connection: Socket): void {
    this.handlers.forEach(({
      authorize,
      checkAdmin,
      event,
      handler,
      paginated,
    }: ImportedHandler): void => {
      connection.on(
        event,
        (payload: Payload): Promise<boolean> => {
          const mutablePayload = { ...payload };
          if (paginated) {
            const { limit = 100, page = 1 } = payload;
            mutablePayload.limit = limit;
            mutablePayload.page = page;
            mutablePayload.offset = calculateOffset(page, limit);
          }
          if (authorize) {
            return authorizationDecorator({
              callback: handler,
              checkAdmin,
              connection,
              event,
              payload: mutablePayload,
            });
          }
          return handler({
            connection,
            payload: mutablePayload,
          });
        },
      );
    });
  }
}

export default new Router();
