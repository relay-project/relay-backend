import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import { getChatMessagesSchema, type ValidationResult } from './validation';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

interface GetChatPayload {
  chatId: number;
}

export const authorize = true;
export const event = EVENTS.GET_CHAT;

export async function handler({
  connection,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<GetChatPayload> = getChatMessagesSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const { chatId } = value;
    const chatAccess = await service.checkChatAccess(chatId, userId);
    if (!chatAccess) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.invalidChatId,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    const chatData = await service.getChat(chatId);

    return response({
      connection,
      event,
      payload: chatData as object,
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
