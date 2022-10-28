import CustomError from '../../utilities/custom-error';
import { getSingleRecord } from './service';
import type { HandlerOptions } from '../../types';
import { loginSchema, type ValidationResult } from './validation';
import response from '../../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../../configuration';

interface RecoveryInitialPayload {
  login: string;
}

export default async function recoveryInitialHandler({
  connection,
  event,
  payload,
}: HandlerOptions): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<RecoveryInitialPayload> = loginSchema.validate(payload);
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const {
      login,
    } = value;

    const userRecord = await getSingleRecord(
      TABLES.users,
      {
        login: login.toLowerCase(),
      },
    );
    if (!userRecord) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.unauthorized,
        status: RESPONSE_STATUSES.unauthorized,
      });
    }

    return response({
      connection,
      event,
      payload: {
        user: {
          id: userRecord.id,
          login: userRecord.login,
          recoveryQuestion: userRecord.recoveryQuestion,
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
