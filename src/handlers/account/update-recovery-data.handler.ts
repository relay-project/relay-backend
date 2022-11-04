import { createHash } from './service';
import CustomError from '../../utilities/custom-error';
import database from '../../database';
import type { HandlerOptions } from '../../types';
import response from '../../utilities/response';
import { TABLES } from '../../configuration';
import { updateRecoveryDataSchema, type ValidationResult } from './validation';

interface UpdateRecoveryDataPayload {
  newRecoveryAnswer: string;
  newRecoveryQuestion: string;
}

export default async function updateRecoveryDataHandler({
  connection,
  event,
  payload,
  userId,
}: HandlerOptions): Promise<boolean> {
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
