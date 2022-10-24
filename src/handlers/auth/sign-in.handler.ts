import { compare } from 'scryptwrap';
import type { Socket } from 'socket.io';
import type { ValidationResult } from 'joi';

import { createToken } from '../../utilities/jwt';
import CustomError from '../../utilities/custom-error';
import database from '../../database';
import response from '../../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../../configuration';
import { signInSchema } from './validation';

interface SignInPayload {
  login: string;
  password: string;
}

const unauthorizedError = new CustomError({
  info: RESPONSE_MESSAGES.unauthorized,
  status: RESPONSE_STATUSES.unauthorized,
});

export default async function signInHandler(
  connection: Socket,
  payload: SignInPayload,
  event: string,
): Promise<boolean> {
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
      throw unauthorizedError;
    }

    const token = await createToken(userRecord.id, secretRecord.secret);
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
