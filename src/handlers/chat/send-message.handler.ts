import createRoomID, { ROOM_PREFIXES } from '../../utilities/rooms';
import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import { sendMessageSchema, type ValidationResult } from './validation';
import * as service from './service';

interface SendMessagePayload {
  chatId: number;
  text: string;
}

export const authorize = true;
export const event = EVENTS.SEND_MESSAGE;

export async function handler({
  connection,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
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

    const message = await service.saveMessage(userId, chatId, text);
    connection.in(createRoomID(ROOM_PREFIXES.chat, chatId)).emit(
      EVENTS.INCOMING_CHAT_MESSAGE,
      {
        ...message,
        isAuthor: false,
      },
    );

    return response({
      connection,
      event,
      payload: message,
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
