import createRoomID, { ROOM_PREFIXES } from '../../utilities/rooms';
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
  chatId: number;
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

    const { chatId, messageId } = value;
    const success = await service.deleteMessage(messageId, userId);
    if (!success) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.invalidMessageId,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    connection.to(createRoomID(ROOM_PREFIXES.chat, chatId)).emit(
      EVENTS.ROOM_DELETE_MESSAGE,
      {
        chatId,
        messageId,
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
