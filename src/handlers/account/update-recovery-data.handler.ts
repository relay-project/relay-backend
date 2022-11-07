import { createHash } from './service';
import CustomError from '../../utilities/custom-error';
import database from '../../database';
import { EVENTS, TABLES } from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import { updateRecoveryDataSchema, type ValidationResult } from './validation';

interface UpdateRecoveryDataPayload {
  newRecoveryAnswer: string;
  newRecoveryQuestion: string;
}

export const authorize = true;
export const event = EVENTS.UPDATE_RECOVERY_DATA;

export async function handler({
  connection,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<UpdateRecoveryDataPayload> = updateRecoveryDataSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const {
      newRecoveryAnswer,
      newRecoveryQuestion,
    } = value;

    const newRecoveryAnswerHash = await createHash(newRecoveryAnswer);
    await database.Instance[TABLES.users].update(
      {
        recoveryAnswer: newRecoveryAnswerHash,
        recoveryQuestion: newRecoveryQuestion,
      },
      {
        where: {
          id: userId,
        },
      },
    );

    return response({
      connection,
      event,
    });
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
