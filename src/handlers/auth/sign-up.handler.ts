import createRoomID, { ROOM_PREFIXES } from '../../utilities/rooms';
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
import { signUpSchema, type ValidationResult } from './validation';

interface SignUpPayload {
  deviceId: string;
  deviceName: string;
  login: string;
  password: string;
  recoveryAnswer: string;
  recoveryQuestion: string;
}

export const event = EVENTS.SIGN_UP;

export async function handler({
  connection,
  payload,
}: HandlerData): Promise<boolean> {
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
    const existingUser = await service.getUser(login.toLowerCase());
    if (existingUser) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.loginAlreadyInUse,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    const transaction = await service.createTransaction();
    try {
      const recoveryAnswerHash = await service.createHash(recoveryAnswer);
      const [passwordHash, userRecord] = await Promise.all([
        service.createHash(password),
        service.createUser(
          login.toLowerCase(),
          recoveryAnswerHash,
          recoveryQuestion,
          transaction,
        ),
      ]);

      const [secretHash] = await Promise.all([
        service.createHash(`${login}-${userRecord.id}-${Date.now()}`),
        service.createDevice(
          deviceId,
          deviceName,
          userRecord.id,
          transaction,
        ),
        service.createPassword(
          passwordHash,
          userRecord.id,
          transaction,
        ),
      ]);

      await service.createSecret(secretHash, userRecord.id, transaction);

      const [token] = await Promise.all([
        service.createNewToken(
          passwordHash,
          secretHash,
          userRecord.id,
        ),
        transaction.commit(),
        redis.setValue(
          redis.keyFormatter(redis.PREFIXES.passwordHash, userRecord.id),
          passwordHash,
        ),
        redis.setValue(
          redis.keyFormatter(redis.PREFIXES.secretHash, userRecord.id),
          secretHash,
        ),
      ]);
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
