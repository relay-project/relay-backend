import createRoomID, { ROOM_PREFIXES } from '../../utilities/rooms';
import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import redis from '../../utilities/redis';
import response from '../../utilities/response';
import type { Result } from '../../database';
import * as service from './service';
import { signInSchema, type ValidationResult } from './validation';

interface SignInPayload {
  deviceId: string;
  deviceName: string;
  login: string;
  password: string;
}

const unauthorizedError = new CustomError({
  info: RESPONSE_MESSAGES.unauthorized,
  status: RESPONSE_STATUSES.unauthorized,
});

export const event = EVENTS.SIGN_IN;

export async function handler({
  connection,
  payload,
}: HandlerData): Promise<boolean> {
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
      deviceId,
      deviceName,
      login,
      password,
    } = value;
    const userRecord = await service.getUser(login.toLowerCase());
    if (!userRecord) {
      throw unauthorizedError;
    }
    if (userRecord.failedLoginAttempts > MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.accountSuspended,
        status: RESPONSE_STATUSES.forbidden,
      });
    }

    const [deviceRecord, passwordRecord, secretRecord] = await Promise.all([
      service.getDevice(userRecord.id, deviceId),
      service.getPassword(userRecord.id),
      service.getSecret(userRecord.id),
    ]);
    if (!(passwordRecord && secretRecord)) {
      throw unauthorizedError;
    }

    const isCorrect = await service.compareHashes(password, passwordRecord.hash);
    if (!isCorrect) {
      await service.setFailedAttempts(
        userRecord.id,
        userRecord.failedLoginAttempts + 1,
      );
      throw unauthorizedError;
    }

    const promises: Promise<Result | string | void>[] = [
      service.createNewToken(
        passwordRecord.hash,
        secretRecord.secret,
        userRecord.id,
        deviceId,
      ),
      redis.setValue(
        redis.keyFormatter(redis.PREFIXES.passwordHash, userRecord.id),
        passwordRecord.hash,
      ),
      redis.setValue(
        redis.keyFormatter(redis.PREFIXES.secretHash, userRecord.id),
        secretRecord.secret,
      ),
    ];
    if (userRecord.failedLoginAttempts > 0) {
      promises.push(service.setFailedAttempts(userRecord.id, 0));
    }
    if (!deviceRecord) {
      promises.push(service.createDevice(deviceId, deviceName, userRecord.id));
    }

    const [token] = await Promise.all(promises);
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
