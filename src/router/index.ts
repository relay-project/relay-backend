import { readdir } from 'node:fs/promises';
import type { Server, Socket } from 'socket.io';

import authorizationDecorator from '../decorators/authorization.decorator';
import calculateOffset from '../utilities/calculate-offset';
import type {
  HandlerData,
  Pagination,
  Payload,
} from '../types';
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

  async loadHandlers(): Promise<void> {
    const path = `${process.cwd()}/build/handlers`;
    const directories = await readdir(path);
    if (directories.length === 0) {
      return log('handlers not found');
    }

    let counter = 0;
    await Promise.all(directories.map(async (directory: string): Promise<void | void[]> => {
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
        this.handlers.push({
          authorize,
          checkAdmin,
          event,
          handler,
          paginated,
        });
        counter += 1;
      }));
    }));
    return log(`event handlers loaded: ${counter}`);
  }

  registerHandlers(connection: Socket, server: Server): void {
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
          const {
            limit = 100,
            page = 1,
            ...payloadWithoutPagination
          } = payload;
          let pagination: null | Pagination = null;
          if (paginated) {
            pagination = {
              limit,
              page,
              offset: calculateOffset(page, limit),
            };
          }
          if (authorize) {
            return authorizationDecorator({
              callback: handler,
              checkAdmin,
              connection,
              event,
              pagination,
              payload: payloadWithoutPagination,
              server,
            });
          }
          return handler({
            connection,
            pagination,
            payload: payloadWithoutPagination,
            server,
          });
        },
      );
    });
  }
}

export default new Router();
