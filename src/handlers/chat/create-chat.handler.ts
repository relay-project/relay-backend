import CustomError from '../../utilities/custom-error';
import { createChatSchema, type ValidationResult } from './validation';
import { EVENTS } from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

interface CreateChatPayload {
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

    const { invited } = value;
    await service.createChat(userId, invited);

    // TODO: notify users

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
