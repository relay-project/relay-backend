import CustomError from '../../utilities/custom-error';
import { deleteMessageSchema, type ValidationResult } from './validation';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

interface DeleteMessagePayload {
  messageId: number;
}

export const authorize = true;
export const event = EVENTS.DELETE_MESSAGE;

export async function handler({
  connection,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<DeleteMessagePayload> = deleteMessageSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const { messageId } = value;

    const success = await service.deleteMessage(messageId, userId);
    if (!success) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.invalidMessageId,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    // TODO: notify the room

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
