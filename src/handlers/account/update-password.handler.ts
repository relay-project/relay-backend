import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import redis from '../../utilities/redis';
import response from '../../utilities/response';
import * as service from './service';
import { updatePasswordSchema, type ValidationResult } from './validation';

interface UpdatePasswordPayload {
  newPassword: string;
  oldPassword: string;
}

export const authorize = true;
export const event = EVENTS.UPDATE_PASSWORD;

export async function handler({
  connection,
  deviceId,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
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

    const transaction = await service.createTransaction();
    try {
      const [passwordRecord, secretRecord] = await service.getPasswordAndSecret(
        userId,
        transaction,
      );
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
        service.createNewToken(
          userId,
          newPasswordHash,
          secretRecord.secret,
          deviceId,
        ),
        service.updatePassword(userId, newPasswordHash, transaction),
        redis.setValue(
          redis.keyFormatter(redis.PREFIXES.passwordHash, userId),
          newPasswordHash,
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
