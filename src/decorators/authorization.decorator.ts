import {
  composeSecret,
  decodeToken,
  verifyToken,
} from '../utilities/jwt';
import createRoomID, { ROOM_PREFIXES } from '../utilities/rooms';
import CustomError from '../utilities/custom-error';
import database from '../database';
import { HandlerOptions } from '../types';
import response from '../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  ROLES,
  TABLES,
} from '../configuration';

type AuthorizationDecoratorOptions = Omit<HandlerOptions, 'userId'> & {
  callback: (options: HandlerOptions) => Promise<boolean>;
  checkAdmin?: boolean;
}

export default async function authorizationDecorator({
  callback,
  checkAdmin = false,
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
          userId,
        },
      }),
      database.Instance[TABLES.secrets].findOne({
        where: {
          userId,
        },
      }),
    ]);
    if (!(passwordRecord && secretRecord)) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.unauthorized,
        status: RESPONSE_STATUSES.unauthorized,
      });
    }

    if (checkAdmin) {
      const userRecord = await database.Instance[TABLES.users].findOne({
        where: {
          id: userId,
        },
      });
      if (!(userRecord && userRecord.role === ROLES.admin)) {
        throw new CustomError({
          info: RESPONSE_MESSAGES.accessDenied,
          status: RESPONSE_STATUSES.forbidden,
        });
      }
    }

    await verifyToken(
      token,
      composeSecret(passwordRecord.hash, secretRecord.secret),
    );

    const userRoom = createRoomID(ROOM_PREFIXES.user, userId);
    const rooms = [...connection.rooms];
    if (!rooms.includes(userRoom)) {
      connection.join(userRoom);
    }

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
        details: error.details || null,
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
