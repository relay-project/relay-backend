import { QueryTypes } from 'sequelize';
import type { Socket } from 'socket.io';

import { CHAT_TYPES, EVENTS } from '../configuration';
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

  const targetIds: { userId: number }[] = await database.Instance.query(
    `WITH data AS (
      SELECT uc."chatId", c.type FROM user_chats uc
        LEFT JOIN chats c ON c.id = uc."chatId"
        WHERE uc."userId" = :userId
          AND uc."chatHidden" = false
          AND c.type = '${CHAT_TYPES.private}'
      ) SELECT uc."userId" FROM data d
        LEFT JOIN user_chats uc ON uc."chatId" = d."chatId"
        WHERE uc."userId" <> :userId;
    `,
    {
      replacements: {
        userId,
      },
      type: QueryTypes.SELECT,
    },
  );
  if (targetIds.length === 0) {
    return null;
  }

  const otherRedisKeys = targetIds.map(
    ({ userId: otherUserId }): string => redis.keyFormatter(
      redis.PREFIXES.userDevice,
      `${otherUserId}-*`,
    ),
  );
  const existingKeys = await Promise.all(otherRedisKeys.map(
    (key: string): Promise<string[]> => redis.getKeys(key),
  ));
  const flatKeys = existingKeys.flat();
  const otherConnectionIds = await Promise.all(flatKeys.map(
    (key: string): Promise<string> => redis.getValue<string>(key),
  ));
  return otherConnectionIds.forEach((otherConnectionId: string): void => {
    connection.to(otherConnectionId).emit(
      EVENTS.USER_DISCONNECTED,
      {
        userId: Number(userId),
      },
    );
  });
}
