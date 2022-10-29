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
import * as service from './service';
import { updatePasswordSchema, type ValidationResult } from './validation';

interface UpdatePasswordPayload {
  newPassword: string;
  oldPassword: string;
}

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
      const [passwordRecord, secretRecord] = await Promise.all([
        database.Instance[TABLES.passwords].findOne({
          transaction,
          where: {
            userId,
          },
        }),
        database.Instance[TABLES.secrets].findOne({
          transaction,
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

      const isCorrect = await service.compareHashes(oldPassword, passwordRecord.hash);
      if (!isCorrect) {
        throw new CustomError({
          info: RESPONSE_MESSAGES.oldPasswordIsInvalid,
          status: RESPONSE_STATUSES.badRequest,
        });
      }

      const newPasswordHash = await service.createHash(newPassword);
      const [token] = await Promise.all([
        createToken(
          userId,
          composeSecret(newPasswordHash, secretRecord.secret),
        ),
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

      await transaction.commit();

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
