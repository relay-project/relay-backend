import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import { getUser } from './service';
import type { HandlerData } from '../../types';
import { loginSchema, type ValidationResult } from './validation';
import response from '../../utilities/response';

interface RecoveryInitialPayload {
  login: string;
}

export const event = EVENTS.RECOVERY_INITIAL_STAGE;

export async function handler({
  connection,
  payload,
}: HandlerData): Promise<boolean> {
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

    const { login } = value;

    const userRecord = await getUser(login.toLowerCase());
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
