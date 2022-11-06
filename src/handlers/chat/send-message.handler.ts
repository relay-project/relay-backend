import CustomError from '../../utilities/custom-error';
import type { HandlerOptions } from '../../types';
import response from '../../utilities/response';
import { RESPONSE_MESSAGES, RESPONSE_STATUSES } from '../../configuration';
import sendMessageSchema, { type ValidationResult } from './validation';
import * as service from './service';

interface SendMessagePayload {
  chatId: number;
  text: string;
}

export default async function sendMessageHandler({
  connection,
  event,
  payload,
  userId,
}: HandlerOptions): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<SendMessagePayload> = sendMessageSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const { chatId, text } = value;

    const chatAccess = await service.checkChatAccess(chatId, userId);
    if (!chatAccess) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.invalidChatId,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    await service.saveMessage(userId, chatId, text);

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
