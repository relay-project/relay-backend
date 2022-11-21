import { EVENTS } from '../../configuration';
import handleDisconnecting from '../../utilities/handle-disconnecting';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';

export const authorize = true;
export const event = EVENTS.LOGOUT;

export async function handler({ connection }: HandlerData): Promise<boolean> {
  try {
    const rooms = [...connection.rooms];
    const filtered = rooms.filter(
      (room: string): boolean => room !== connection.id,
    );
    filtered.forEach((room: string): void | Promise<void> => connection.leave(room));

    await handleDisconnecting(connection);

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
