import type { Socket } from 'socket.io';

import authorizationDecorator from '../decorators/authorization.decorator';
import completeLogoutHandler from '../handlers/auth/complete-logout.handler';
import deleteAccountHandler from '../handlers/account/delete-account.handler';
import { EVENTS } from '../configuration';
import type { Payload } from '../types';
import recoveryFinalHandler from '../handlers/auth/recovery-final.handler';
import recoveryInitialHandler from '../handlers/auth/recovery-initial.handler';
import signInHandler from '../handlers/auth/sign-in.handler';
import signUpHandler from '../handlers/auth/sign-up.handler';
import updatePasswordHandler from '../handlers/account/update-password.handler';
import updateRecoveryDataHandler from '../handlers/account/update-recovery-data.handler';

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
  connection.on(
    EVENTS.DELETE_ACCOUNT,
    (payload: Payload): Promise<boolean> => authorizationDecorator({
      callback: deleteAccountHandler,
      connection,
      event: EVENTS.DELETE_ACCOUNT,
      payload,
    }),
  );
  connection.on(
    EVENTS.FIND_USERS,
    (payload: Payload): Promise<boolean> => authorizationDecorator({
      callback: updatePasswordHandler,
      connection,
      event: EVENTS.FIND_USERS,
      payload,
    }),
  );
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
  connection.on(
    EVENTS.UPDATE_PASSWORD,
    (payload: Payload): Promise<boolean> => authorizationDecorator({
      callback: updatePasswordHandler,
      connection,
      event: EVENTS.UPDATE_PASSWORD,
      payload,
    }),
  );
  connection.on(
    EVENTS.UPDATE_RECOVERY_DATA,
    (payload: Payload): Promise<boolean> => authorizationDecorator({
      callback: updateRecoveryDataHandler,
      connection,
      event: EVENTS.UPDATE_RECOVERY_DATA,
      payload,
    }),
  );
}
