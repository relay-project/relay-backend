import { hash } from 'scryptwrap';
import type { Socket } from 'socket.io';

import CustomError from '../../utilities/custom-error';
import database from '../../database';
import response from '../../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../../configuration';

const unauthorizedError = new CustomError({
  info: RESPONSE_MESSAGES.unauthorized,
  status: RESPONSE_STATUSES.unauthorized,
});

export default async function completeLogoutHandler(
  connection: Socket,
  payload: null,
  event: string,
): Promise<boolean> {
  try {
    const secretRecord = await database.Instance[TABLES.secrets].findOne({
      where: {
        userId: 1,
      },
    });
    if (!secretRecord) {
      throw unauthorizedError;
    }

    // TODO: use proper values
    const newSecretHash = await hash(`${1}-login-${Date.now()}`);

    // TODO: use proper values
    await database.Instance[TABLES.secrets].update(
      {
        secret: newSecretHash,
      },
      {
        where: {
          userId: 1,
        },
      },
    );

    return response({
      connection,
      event,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return response({
        connection,
        details: error.details || '',
        event,
        info: error.info,
        status: error.status,
      });
    }
    return response({
      connection,
      error,
      event,
    });
  }
}
