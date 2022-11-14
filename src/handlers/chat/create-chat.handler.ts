import CustomError from '../../utilities/custom-error';
import { createChatSchema, type ValidationResult } from './validation';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

interface CreateChatPayload {
  chatName?: string;
  invited: number[];
}

export const authorize = true;
export const event = EVENTS.CREATE_CHAT;

export async function handler({
  connection,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<CreateChatPayload> = createChatSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const { chatName = '', invited } = value;
    const filtered = invited.filter((id: number): boolean => id !== userId);
    if (filtered.length === 0) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.invalidData,
        status: RESPONSE_STATUSES.badRequest,
      });
    }
    if (filtered.length > 2 && !chatName) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.missingData,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    const { chatId, isNew } = await service.createChat(userId, filtered, chatName);
    if (isNew) {
      // TODO: notify users
    }

    return response({
      connection,
      event,
      payload: {
        chatId,
        isNew,
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
