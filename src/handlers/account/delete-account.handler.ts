import { deleteAccount } from './service';
import { EVENTS } from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';

export const authorize = true;
export const event = EVENTS.DELETE_ACCOUNT;

export async function handler({
  connection,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    await deleteAccount(userId);

    return response({
      connection,
      event,
    });
  } catch (error) {
    return response({
      connection,
      error,
      event,
    });
  }
}
