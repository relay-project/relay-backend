import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import { recoveryFinalSchema, type ValidationResult } from './validation';
import redis from '../../utilities/redis';
import response from '../../utilities/response';
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

export const event = EVENTS.RECOVERY_FINAL_STAGE;

export async function handler({
  connection,
  payload,
}: HandlerData): Promise<boolean> {
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

    const [
      passwordRecord,
      secretRecord,
      userRecord,
    ] = await Promise.all([
      service.getPassword(userId),
      service.getSecret(userId),
      service.getUser(userId, true),
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

    const transaction = await service.createTransaction();
    try {
      await Promise.all([
        service.recoveryFinalUpdateData(
          newPasswordHash,
          newSecretHash,
          passwordRecord.id,
          secretRecord.id,
          userId,
          transaction,
        ),
        redis.deleteValue(redis.keyFormatter(redis.PREFIXES.passwordHash, userId)),
        redis.deleteValue(redis.keyFormatter(redis.PREFIXES.secretHash, userId)),
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
