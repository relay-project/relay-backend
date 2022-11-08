import { readdir } from 'node:fs/promises';
import type { Socket } from 'socket.io';

import authorizationDecorator from '../decorators/authorization.decorator';
// import inviteUserHandler from '../handlers/chat/invite-user';
// import { EVENTS } from '../configuration';
import type { HandlerData, Payload } from '../types';
// import sendMessageHandler from '../handlers/chat/send-message.handler';
import log from '../utilities/logger';

interface ImportedHandler {
  authorize?: boolean;
  checkAdmin?: boolean;
  event: string;
  handler: (data: HandlerData) => Promise<boolean>;
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
    }: ImportedHandler): void => {
      connection.on(
        event,
        (payload: Payload): Promise<boolean> => {
          if (authorize) {
            return authorizationDecorator({
              callback: handler,
              checkAdmin,
              connection,
              event,
              payload,
            });
          }
          return handler({
            connection,
            payload,
          });
        },
      );
    });
  }
}

export default new Router();
