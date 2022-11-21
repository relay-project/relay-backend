import { EVENTS } from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

export const authorize = true;
export const event = EVENTS.GET_CONNECTED_DEVICES;

export async function handler({
  connection,
  deviceId,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const connectedDevices = await service.getConnectedDevices({ deviceId, userId });
    return response({
      connection,
      event,
      payload: connectedDevices,
    });
  } catch (error) {
    return response({
      connection,
      error,
      event,
    });
  }
}
