import { readdir } from 'node:fs/promises';
import type { Socket } from 'socket.io';

import authorizationDecorator from '../decorators/authorization.decorator';
import completeLogoutHandler from '../handlers/auth/complete-logout.handler';
// import inviteUserHandler from '../handlers/chat/invite-user';
import { EVENTS } from '../configuration';
import type { HandlerData, Payload } from '../types';
import recoveryFinalHandler from '../handlers/auth/recovery-final.handler';
import recoveryInitialHandler from '../handlers/auth/recovery-initial.handler';
import sendMessageHandler from '../handlers/chat/send-message.handler';
import signInHandler from '../handlers/auth/sign-in.handler';
import signUpHandler from '../handlers/auth/sign-up.handler';
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

  async loadHandlers(): Promise<void> {
    const path = `${process.cwd()}/build/handlers`;
    const directories = await readdir(path);
    if (directories.length === 0) {
      return log('handlers not found');
    }

    // TODO: remove
    const filtered = directories.filter((directory: string): boolean => directory === 'account');

    await Promise.all(filtered.map(async (directory: string): Promise<void | void[]> => {
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
        log(`- loaded handler: ${event}`);
        this.handlers.push({
          authorize,
          checkAdmin,
          event,
          handler,
        });
      }));
    }));
    return log('all handlers are loaded');
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

export const routerInstance = new Router();

export default function router(connection: Socket): void {
  connection.on(
    EVENTS.COMPLETE_LOGOUT,
    (payload: Payload): Promise<boolean> => authorizationDecorator({
      callback: completeLogoutHandler,
      connection,
      event: EVENTS.COMPLETE_LOGOUT,
      payload,
    }),
  );
  // connection.on(
  //   EVENTS.INVITE_USER,
  //   (payload: Payload): Promise<boolean> => authorizationDecorator({
  //     callback: inviteUserHandler,
  //     connection,
  //     event: EVENTS.INVITE_USER,
  //     payload,
  //   }),
  // );
  connection.on(
    EVENTS.RECOVERY_FINAL_STAGE,
    (payload: Payload): Promise<boolean> => recoveryFinalHandler({
      connection,
      event: EVENTS.RECOVERY_FINAL_STAGE,
      payload,
    }),
  );
  connection.on(
    EVENTS.RECOVERY_INITIAL_STAGE,
    (payload: Payload): Promise<boolean> => recoveryInitialHandler({
      connection,
      event: EVENTS.RECOVERY_INITIAL_STAGE,
      payload,
    }),
  );
  connection.on(
    EVENTS.SEND_MESSAGE,
    (payload: Payload): Promise<boolean> => authorizationDecorator({
      callback: sendMessageHandler,
      connection,
      event: EVENTS.SEND_MESSAGE,
      payload,
    }),
  );
  connection.on(
    EVENTS.SIGN_IN,
    (payload: Payload): Promise<boolean> => signInHandler({
      connection,
      event: EVENTS.SIGN_IN,
      payload,
    }),
  );
  connection.on(
    EVENTS.SIGN_UP,
    (payload: Payload): Promise<boolean> => signUpHandler({
      connection,
      event: EVENTS.SIGN_UP,
      payload,
    }),
  );
}
