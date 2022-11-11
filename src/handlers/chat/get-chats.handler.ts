import { EVENTS } from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

export const authorize = true;
export const event = EVENTS.GET_CHATS;
export const paginated = true;

export async function handler({
  connection,
  pagination,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const chats = await service.getChats({ pagination, userId });
    return response({
      connection,
      event,
      payload: chats,
    });
  } catch (error) {
    return response({
      connection,
      error,
      event,
    });
  }
}
