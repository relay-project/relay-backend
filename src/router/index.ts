import type { Socket } from 'socket.io';

import authorizationDecorator from '../decorators/authorization.decorator';
import completeLogoutHandler from '../handlers/auth/complete-logout.handler';
import { EVENTS } from '../configuration';
import signInHandler from '../handlers/auth/sign-in.handler';
import signUpHandler from '../handlers/auth/sign-up.handler';
import updatePasswordHandler from '../handlers/account/update-password.handler';

export default function router(connection: Socket): void {
  connection.on(
    EVENTS.COMPLETE_LOGOUT,
    (payload): Promise<boolean> => authorizationDecorator({
      callback: completeLogoutHandler,
      connection,
      event: EVENTS.COMPLETE_LOGOUT,
      payload,
    }),
  );
  connection.on(
    EVENTS.SIGN_IN,
    (payload): Promise<boolean> => signInHandler({
      connection,
      event: EVENTS.SIGN_IN,
      payload,
    }),
  );
  connection.on(
    EVENTS.SIGN_UP,
    (payload): Promise<boolean> => signUpHandler({
      connection,
      event: EVENTS.SIGN_UP,
      payload,
    }),
  );
  connection.on(
    EVENTS.UPDATE_PASSWORD,
    (payload): Promise<boolean> => authorizationDecorator({
      callback: updatePasswordHandler,
      connection,
      event: EVENTS.COMPLETE_LOGOUT,
      payload,
    }),
  );
  connection.on(
    EVENTS.UPDATE_RECOVERY_DATA,
    (payload): Promise<boolean> => authorizationDecorator({
      callback: updatePasswordHandler,
      connection,
      event: EVENTS.COMPLETE_LOGOUT,
      payload,
    }),
  );
}
