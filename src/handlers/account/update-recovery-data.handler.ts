import CustomError from '../../utilities/custom-error';
import { EVENTS } from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';
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

    const newRecoveryAnswerHash = await service.createHash(newRecoveryAnswer);
    await service.updateRecoveryData(userId, newRecoveryAnswerHash, newRecoveryQuestion);

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
