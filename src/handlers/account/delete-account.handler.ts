import { deleteAccount } from './service';
import { EVENTS } from '../../configuration';
import type { HandlerData } from '../../types';
import redis from '../../utilities/redis';
import response from '../../utilities/response';

export const authorize = true;
export const event = EVENTS.DELETE_ACCOUNT;

export async function handler({
  connection,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    await Promise.all([
      deleteAccount(userId),
      redis.deleteValue(redis.keyFormatter(redis.PREFIXES.passwordHash, userId)),
      redis.deleteValue(redis.keyFormatter(redis.PREFIXES.secretHash, userId)),
    ]);

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
