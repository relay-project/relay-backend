import { hash } from 'scryptwrap';
import type { Socket } from 'socket.io';
import type { ValidationResult } from 'joi';

import { createToken } from '../../utilities/jwt';
import CustomError from '../../utilities/custom-error';
import database from '../../database';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../../configuration';
import response from '../../utilities/response';
import { signUpSchema } from './validation';

interface SignUpPayload {
  deviceId: string;
  login: string;
  password: string;
  recoveryAnswer: string;
  recoveryQuestion: string;
}

export default async function signUpHandler(
  connection: Socket,
  payload: SignUpPayload,
): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<SignUpPayload> = signUpSchema.validate(payload);
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const {
      deviceId,
      login,
      password,
      recoveryAnswer,
      recoveryQuestion,
    } = value;
    const existingUser = database.Instance[TABLES.users].findOne({
      where: {
        login: value.login,
      },
    });
    if (existingUser) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.emailAlreadyInUse,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    const transaction = await database.Instance.transaction();
    try {
      const [passwordHash, userRecord] = await Promise.all([
        hash(password),
        database.Instance[TABLES.users].create(
          {
            login,
            recoveryAnswer,
            recoveryQuestion,
          },
          {
            transaction,
          },
        ),
      ]);

      const [secretHash] = await Promise.all([
        hash(password),
        database.Instance[TABLES.passwords].create(
          {
            hash: passwordHash,
            userId: userRecord.id,
          },
          {
            transaction,
          },
        ),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const token = await createToken(value.login, 'str');
    return response({
      connection,
      event: EVENTS.SIGN_IN,
      payload: {
        token,
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return response({
        connection,
        details: error.details || '',
        event: EVENTS.SIGN_IN,
        info: error.info,
        status: error.status,
      });
    }
    return response({
      connection,
      error,
      event: EVENTS.SIGN_IN,
    });
  }
}
