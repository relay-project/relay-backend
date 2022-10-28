import CustomError from '../../utilities/custom-error';
import database from '../../database';
import type { HandlerOptions } from '../../types';
import { recoveryFinalSchema, type ValidationResult } from './validation';
import response from '../../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../../configuration';
import * as service from './service';

interface RecoveryFinalPayload {
  newPassword: string;
  recoveryAnswer: string;
  userId: number;
}

const unauthorizedError = new CustomError({
  info: RESPONSE_MESSAGES.unauthorized,
  status: RESPONSE_STATUSES.unauthorized,
});

export default async function recoveryFinalHandler({
  connection,
  event,
  payload,
}: HandlerOptions): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<RecoveryFinalPayload> = recoveryFinalSchema.validate(payload);
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const {
      newPassword,
      recoveryAnswer,
      userId,
    } = value;

    const [passwordRecord, secretRecord, userRecord] = await Promise.all([
      service.getSingleRecord(TABLES.passwords, { userId }),
      service.getSingleRecord(TABLES.secrets, { userId }),
      service.getSingleRecord(TABLES.users, { id: userId }),
    ]);
    if (!(passwordRecord && secretRecord && userRecord)) {
      throw unauthorizedError;
    }

    const isValidAnswer = await service.compareHashes(
      recoveryAnswer,
      userRecord.recoveryAnswer,
    );
    if (!isValidAnswer) {
      throw unauthorizedError;
    }

    const [newPasswordHash, newSecretHash] = await Promise.all([
      service.createHash(newPassword),
      service.createHash(`${userRecord.id}-${userRecord.login}-${Date.now()}`),
    ]);

    const transaction = await database.Instance.transaction();
    try {
      await Promise.all([
        database.Instance[TABLES.passwords].update(
          {
            hash: newPasswordHash,
          },
          {
            transaction,
            where: {
              id: passwordRecord.id,
            },
          },
        ),
        database.Instance[TABLES.secrets].update(
          {
            secret: newSecretHash,
          },
          {
            transaction,
            where: {
              id: secretRecord.id,
            },
          },
        ),
        database.Instance[TABLES.users].update(
          {
            failedLoginAttempts: 0,
          },
          {
            transaction,
            where: {
              id: userRecord.id,
            },
          },
        ),
      ]);
      await transaction.commit();

      return response({
        connection,
        event,
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
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
