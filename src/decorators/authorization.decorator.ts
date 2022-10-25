import { composeSecret, decodeToken, verifyToken } from '../utilities/jwt';
import CustomError from '../utilities/custom-error';
import database from '../database';
import { HandlerOptions } from '../types';
import response from '../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../configuration';

type AuthorizationDecoratorOptions = Omit<HandlerOptions, 'userId'> & {
  callback: (options: HandlerOptions) => Promise<boolean>;
}

const unauthorizedError = new CustomError({
  info: RESPONSE_MESSAGES.unauthorized,
  status: RESPONSE_STATUSES.unauthorized,
});

export default async function authorizationDecorator({
  callback,
  connection,
  event,
  payload,
}: AuthorizationDecoratorOptions): Promise<boolean> {
  try {
    const { token = '' } = payload;
    if (!token) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.missingToken,
        status: RESPONSE_STATUSES.unauthorized,
      });
    }

    const userId = decodeToken(token);
    const [passwordRecord, secretRecord] = await Promise.all([
      database.Instance[TABLES.passwords].findOne({
        where: {
          userId: 1,
        },
      }),
      database.Instance[TABLES.secrets].findOne({
        where: {
          userId: 1,
        },
      }),
    ]);
    if (!(passwordRecord && secretRecord)) {
      throw unauthorizedError;
    }

    await verifyToken(
      token,
      composeSecret(passwordRecord.hash, secretRecord.secret),
    );

    return callback({
      connection,
      event,
      payload,
      userId,
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
