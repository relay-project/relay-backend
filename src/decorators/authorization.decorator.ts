import {
  composeSecret,
  decodeToken,
  verifyToken,
} from '../utilities/jwt';
import createRoomID, { ROOM_PREFIXES } from '../utilities/rooms';
import CustomError from '../utilities/custom-error';
import database, { TABLES } from '../database';
import type { HandlerData, Pagination } from '../types';
import redis from '../utilities/redis';
import response from '../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  ROLES,
} from '../configuration';

type AuthorizationDecoratorOptions = Omit<HandlerData, 'userId'> & {
  callback: (options: HandlerData) => Promise<boolean>;
  checkAdmin?: boolean;
  event: string;
  pagination?: Pagination;
}

export default async function authorizationDecorator({
  callback,
  checkAdmin = false,
  connection,
  event,
  pagination = null,
  payload,
}: AuthorizationDecoratorOptions): Promise<boolean> {
  try {
    const { token = '', ...payloadWithoutToken } = payload;
    if (!token) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.missingToken,
        status: RESPONSE_STATUSES.unauthorized,
      });
    }

    const userId = decodeToken(token);

    let [passwordHash, secretHash] = await Promise.all([
      redis.getValue<string>(redis.keyFormatter(redis.PREFIXES.passwordHash, userId)),
      redis.getValue<string>(redis.keyFormatter(redis.PREFIXES.secretHash, userId)),
    ]);
    if (!(passwordHash && secretHash)) {
      const [passwordRecord, secretRecord] = await Promise.all([
        database.singleRecordAction({
          action: 'findOne',
          condition: {
            userId,
          },
          table: TABLES.passwords,
        }),
        database.singleRecordAction({
          action: 'findOne',
          condition: {
            userId,
          },
          table: TABLES.secrets,
        }),
      ]);
      if (!(passwordRecord && secretRecord)) {
        throw new CustomError({
          info: RESPONSE_MESSAGES.unauthorized,
          status: RESPONSE_STATUSES.unauthorized,
        });
      }
      passwordHash = passwordRecord.hash;
      secretHash = secretRecord.secret;
      await Promise.all([
        redis.setValue(
          redis.keyFormatter(redis.PREFIXES.passwordHash, userId),
          passwordHash,
        ),
        redis.setValue(
          redis.keyFormatter(redis.PREFIXES.secretHash, userId),
          secretHash,
        ),
      ]);
    } else {
      await Promise.all([
        redis.expire(redis.keyFormatter(redis.PREFIXES.passwordHash, userId)),
        redis.expire(redis.keyFormatter(redis.PREFIXES.secretHash, userId)),
      ]);
    }
    if (!(passwordHash && secretHash)) {
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
      composeSecret(passwordHash, secretHash),
    );

    const userRoom = createRoomID(ROOM_PREFIXES.user, userId);
    const rooms = [...connection.rooms];
    if (!rooms.includes(userRoom)) {
      connection.join(userRoom);
    }

    return callback({
      connection,
      payload: payloadWithoutToken,
      pagination,
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
