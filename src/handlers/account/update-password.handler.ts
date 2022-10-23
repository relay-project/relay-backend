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
import updatePasswordSchema from './validation';

interface UpdatePasswordPayload {
  newPassword: string;
  oldPassword: string;
}

const unauthorizedError = new CustomError({
  info: RESPONSE_MESSAGES.unauthorized,
  status: RESPONSE_STATUSES.unauthorized,
});

export default async function updatePasswordHandler(
  connection: Socket,
  payload: UpdatePasswordPayload,
  event: string,
): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<UpdatePasswordPayload> = updatePasswordSchema.validate(payload);
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const {
      newPassword,
      oldPassword,
    } = value;
    // const userRecord = await database.Instance[TABLES.users].findOne({
    //   where: {
    //     login,
    //   },
    // });
    // if (!userRecord) {
    //   throw unauthorizedError;
    // }

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

    const isCorrect = await compare(passwordRecord.hash, oldPassword);
    if (!isCorrect) {
      throw unauthorizedError;
    }

    const token = await createToken(1, secretRecord.secret);
    return response({
      connection,
      event,
      payload: {
        token,
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
