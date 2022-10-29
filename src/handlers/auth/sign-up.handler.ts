import { composeSecret, createToken } from '../../utilities/jwt';
import createRoomID, { ROOM_PREFIXES } from '../../utilities/rooms';
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
import { signUpSchema, type ValidationResult } from './validation';

interface SignUpPayload {
  deviceId: string;
  deviceName: string;
  login: string;
  password: string;
  recoveryAnswer: string;
  recoveryQuestion: string;
}

export default async function signUpHandler({
  connection,
  event,
  payload,
}: HandlerOptions): Promise<boolean> {
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
        login: login.toLowerCase(),
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
      const recoveryAnswerHash = await service.createHash(recoveryAnswer);
      const [passwordHash, userRecord] = await Promise.all([
        service.createHash(password),
        database.Instance[TABLES.users].create(
          {
            login: login.toLowerCase(),
            recoveryAnswer: recoveryAnswerHash,
            recoveryQuestion,
          },
          {
            transaction,
          },
        ),
      ]);

      const [secretHash] = await Promise.all([
        service.createHash(`${login}-${userRecord.id}-${Date.now()}`),
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
        createToken(
          userRecord.id,
          composeSecret(passwordHash, secretHash),
        ),
        transaction.commit(),
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
