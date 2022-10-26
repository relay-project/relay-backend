import { compare } from 'scryptwrap';
import type { ValidationResult } from 'joi';

import { composeSecret, createToken } from '../../utilities/jwt';
import createRoomID, { ROOM_PREFIXES } from '../../utilities/rooms';
import CustomError from '../../utilities/custom-error';
import database from '../../database';
import type { HandlerOptions } from '../../types';
import {
  MAX_FAILED_LOGIN_ATTEMPTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../../configuration';
import response from '../../utilities/response';
import { signInSchema } from './validation';

interface SignInPayload {
  login: string;
  password: string;
}

const unauthorizedError = new CustomError({
  info: RESPONSE_MESSAGES.unauthorized,
  status: RESPONSE_STATUSES.unauthorized,
});

export default async function signInHandler({
  connection,
  event,
  payload,
}: HandlerOptions): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<SignInPayload> = signInSchema.validate(payload);
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const {
      login,
      password,
    } = value;
    const userRecord = await database.Instance[TABLES.users].findOne({
      where: {
        login,
      },
    });
    if (!userRecord) {
      throw unauthorizedError;
    }
    if (userRecord.failedLoginAttempts > MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.accountSuspended,
        status: RESPONSE_STATUSES.forbidden,
      });
    }

    const [passwordRecord, secretRecord] = await Promise.all([
      database.Instance[TABLES.passwords].findOne({
        where: {
          userId: userRecord.id,
        },
      }),
      database.Instance[TABLES.secrets].findOne({
        where: {
          userId: userRecord.id,
        },
      }),
    ]);
    if (!(passwordRecord && secretRecord)) {
      throw unauthorizedError;
    }

    const isCorrect = await compare(passwordRecord.hash, password);
    if (!isCorrect) {
      await database.Instance[TABLES.users].update(
        {
          failedLoginAttempts: userRecord.failedLoginAttempts + 1,
        },
        {
          where: {
            id: userRecord.id,
          },
        },
      );
      throw unauthorizedError;
    }

    const promises = [createToken(
      userRecord.id,
      composeSecret(passwordRecord.hash, secretRecord.secret),
    )];
    if (userRecord.failedLoginAttempts > 0) {
      promises.push(database.Instance[TABLES.users].update(
        {
          failedLoginAttempts: 0,
        },
        {
          where: {
            id: userRecord.id,
          },
        },
      ));
    }
    const [token] = await Promise.all(promises);
    connection.join(createRoomID(ROOM_PREFIXES.user, userRecord.id));

    return response({
      connection,
      event,
      payload: {
        token,
        user: {
          id: userRecord.id,
          login: userRecord.login,
          role: userRecord.role,
        },
      },
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
