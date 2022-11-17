import type { Socket } from 'socket.io';

import { EVENTS } from '../configuration';
import database, { type Device, TABLES } from '../database';
import redis from './redis';

export default async function handleDisconnecting(
  connection: Socket,
): Promise<null | void> {
  const { id: connectionId } = connection;

  const userDeviceKey = await redis.getValue<string>(connectionId);
  if (!userDeviceKey) {
    return null;
  }
  const [userId, deviceId] = userDeviceKey.split('-').slice(-2);
  if (!(deviceId && userId)) {
    return null;
  }
  await Promise.all([
    redis.deleteValue(connectionId),
    redis.deleteValue(userDeviceKey),
  ]);

  const userDeviceKeys = await redis.getKeys(
    redis.keyFormatter(
      redis.PREFIXES.userDevice,
      `${userId}-*`,
    ),
  );
  if (userDeviceKeys.length > 0) {
    let deviceName = deviceId;
    const device = await database.singleRecordAction<Device>({
      action: 'findOne',
      condition: {
        deviceId,
        userId,
      },
      table: TABLES.devices,
    });
    if (device) {
      deviceName = device.deviceName;
    }
    await Promise.all(userDeviceKeys.map(async (key: string): Promise<void> => {
      const otherConnectionId = await redis.getValue<string>(key);
      connection.to(otherConnectionId).emit(
        EVENTS.DEVICE_DISCONNECTED,
        {
          deviceId,
          deviceName,
          userId,
        },
      );
    }));
    return null;
  }

  // TODO: get all related user IDs (database)
  // notify all of the related user IDs
  return;
}
