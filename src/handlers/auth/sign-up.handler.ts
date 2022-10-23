import { hash } from 'scryptwrap';
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
import { signUpSchema } from './validation';

interface SignUpPayload {
  deviceId: string;
  deviceName: string;
  login: string;
  password: string;
  recoveryAnswer: string;
  recoveryQuestion: string;
}

export default async function signUpHandler(
  connection: Socket,
  payload: SignUpPayload,
  event: string,
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
      deviceName,
      login,
      password,
      recoveryAnswer,
      recoveryQuestion,
    } = value;
    const existingUser = await database.Instance[TABLES.users].findOne({
      where: {
        login: value.login,
      },
    });
    if (existingUser) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.loginAlreadyInUse,
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
        hash(`${login}-${userRecord.id}-${Date.now()}`),
        database.Instance[TABLES.devices].create(
          {
            deviceId,
            deviceName,
            userId: userRecord.id,
          },
          {
            transaction,
          },
        ),
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

      await database.Instance[TABLES.secrets].create(
        {
          secret: secretHash,
          userId: userRecord.id,
        },
        {
          transaction,
        },
      );

      const [token] = await Promise.all([
        createToken(userRecord.id, secretHash),
        transaction.commit(),
      ]);

      return response({
        connection,
        event,
        payload: {
          token,
          user: userRecord,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
