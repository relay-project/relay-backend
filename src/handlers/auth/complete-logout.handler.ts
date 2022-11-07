import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

export const authorize = true;
export const event = EVENTS.COMPLETE_LOGOUT;

export async function handler({
  connection,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const secretRecord = await service.getSecret(userId);
    if (!secretRecord) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.unauthorized,
        status: RESPONSE_STATUSES.unauthorized,
      });
    }

    const newSecretHash = await service.createHash(`${secretRecord.userId}-${Date.now()}`);
    await service.updateSecret(userId, newSecretHash);

    return response({
      connection,
      event,
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
