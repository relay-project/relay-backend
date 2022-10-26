import { compare, hash } from 'scryptwrap';
import type { ValidationResult } from 'joi';

import { composeSecret, createToken } from '../../utilities/jwt';
import CustomError from '../../utilities/custom-error';
import database from '../../database';
import type { HandlerOptions } from '../../types';
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

export default async function updatePasswordHandler({
  connection,
  event,
  payload,
  userId,
}: HandlerOptions): Promise<boolean> {
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

    const transaction = await database.Instance.transaction();
    try {
      const passwordRecord = await database.Instance[TABLES.passwords].findOne({
        transaction,
        where: {
          userId,
        },
      });
      if (!passwordRecord) {
        throw unauthorizedError;
      }

      const isCorrect = await compare(passwordRecord.hash, oldPassword);
      if (!isCorrect) {
        throw new CustomError({
          info: RESPONSE_MESSAGES.oldPasswordIsInvalid,
          status: RESPONSE_STATUSES.badRequest,
        });
      }

      const newPasswordHash = await hash(newPassword);
      const [secretRecord] = await Promise.all([
        database.Instance[TABLES.secrets].findOne({
          transaction,
          where: {
            userId,
          },
        }),
        database.Instance[TABLES.passwords].update(
          {
            hash: newPasswordHash,
          },
          {
            transaction,
            where: {
              userId,
            },
          },
        ),
      ]);

      await Promise.all([
        createToken(
          userId,
          composeSecret(newPasswordHash, secretRecord.secret),
        ),
        transaction.commit(),
      ]);

      return response({
        connection,
        event,
        payload: {
          token,
        },
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
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
