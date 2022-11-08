import CustomError from '../../utilities/custom-error';
import { EVENTS } from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

export const authorize = true;
export const event = EVENTS.GET_CHATS;
export const paginated = true;

export async function handler({
  connection,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const res = await service.getChats(userId, payload.limit, payload.offset);
    return response({
      connection,
      event,
      payload: res,
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
