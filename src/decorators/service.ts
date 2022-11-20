import { QueryTypes } from 'sequelize';
import { Socket } from 'socket.io';

import { CHAT_TYPES, EVENTS } from '../configuration';
import database, {
  type Device,
  TABLES,
} from '../database';
import redis from '../utilities/redis';

interface FirstRequestOptions {
  connection: Socket;
  deviceId: string;
  userId: number;
  userRoom: string;
}

export default async function handleFirstRequest({
  connection,
  deviceId,
  userId,
  userRoom,
}: FirstRequestOptions): Promise<boolean[] | null | void> {
  const userDeviceKey = redis.keyFormatter(
    redis.PREFIXES.userDevice,
    `${userId}-${deviceId}`,
  );

  const [registeredConnectionId, registeredDevice] = await Promise.all([
    redis.getValue<string>(userDeviceKey),
    redis.getValue<string>(connection.id),
  ]);
  if (!(registeredConnectionId
    && registeredConnectionId === connection.id && registeredDevice)) {
    await Promise.all([
      redis.setValue(connection.id, userDeviceKey),
      redis.setValue(userDeviceKey, connection.id),
    ]);

    // notify other connected user devices
    const deviceRecord = await database.singleRecordAction<Device>({
      action: 'findOne',
      condition: {
        deviceId,
        userId,
      },
      table: TABLES.devices,
    });
    if (deviceRecord) {
      connection.to(userRoom).emit(
        EVENTS.DEVICE_CONNECTED,
        deviceRecord,
      );
    }

    // TODO: make this work for group chats as well
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
    if (!(targetIds && Array.isArray(targetIds))) {
      return null;
    }

    const redisKeys = await Promise.all(
      targetIds.map(
        ({ userId: otherUserId }): Promise<string[]> => redis.getKeys(
          redis.keyFormatter(
            redis.PREFIXES.userDevice,
            `${otherUserId}-*`,
          ),
        ),
      ),
    );
    const flatKeys = redisKeys.flat();
    if (flatKeys.length === 0) {
      return null;
    }
    const connectionIds = await Promise.all(
      flatKeys.map(
        (key: string): Promise<string> => redis.getValue<string>(key),
      ),
    );
    return connectionIds.forEach(
      (connectionId: string): boolean => connection.to(connectionId).emit(
        EVENTS.USER_CONNECTED,
        {
          userId,
        },
      ),
    );
  }
  return Promise.all([
    redis.expire(connection.id),
    redis.expire(userDeviceKey),
  ]);
}
