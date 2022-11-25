import { Op, QueryTypes } from 'sequelize';

import { CHAT_TYPES } from '../../configuration';
import database, {
  type Chat,
  type CountResult,
  type Message,
  type PaginatedResult,
  type Result,
  type UserChat,
  type User,
  TABLES,
} from '../../database';
import type { Pagination } from '../../types';
import redis from '../../utilities/redis';

export async function checkChatAccess(
  chatId: number,
  userId: number,
): Promise<boolean> {
  const userAccess = await database.singleRecordAction<UserChat>({
    action: 'findOne',
    condition: {
      chatId,
      chatHidden: false,
      userId,
    },
    table: TABLES.userChats,
  });
  return !!userAccess;
}

export async function createChat(
  userId: number,
  invited: number[],
  chatName = '',
): Promise<{ chatId: number, isNew: boolean }> {
  const isPrivate = invited.length === 1;
  if (isPrivate) {
    const [existingChat = null] = await database.Instance.query<{ id: number }>(
      `SELECT c.id FROM user_chats uc
        LEFT JOIN chats c ON c.id = uc."chatId"
        WHERE (uc."userId" = :userId OR uc."userId" = :otherUserId)
          AND c.type = '${CHAT_TYPES.private}'
        GROUP BY c.id HAVING COUNT(uc.*) = 2;
      `,
      {
        replacements: {
          otherUserId: invited[0],
          userId,
        },
        type: QueryTypes.SELECT,
      },
    );
    if (existingChat) {
      // make sure that it's no longer hidden from both users
      await database.Instance[TABLES.userChats].update(
        {
          chatHidden: false,
        },
        {
          where: {
            chatId: existingChat.id,
          },
        },
      );
      return {
        chatId: existingChat.id,
        isNew: false,
      };
    }
  }

  const chatRecord = await database.Instance[TABLES.chats].create({
    createdBy: userId,
    name: invited.length > 1
      ? chatName
      : '',
    type: invited.length > 1
      ? CHAT_TYPES.group
      : CHAT_TYPES.private,
  });

  await database.Instance[TABLES.userChats].create({
    chatId: chatRecord.id,
    userId,
  });

  await Promise.all(invited.map(async (id: number): Promise<void> => {
    const existingUser = await database.singleRecordAction<User>({
      action: 'findOne',
      condition: {
        id,
      },
      table: TABLES.users,
    });
    if (existingUser) {
      await database.Instance[TABLES.userChats].create({
        chatId: chatRecord.id,
        userId: existingUser.id,
      });
    }
  }));
  return {
    chatId: chatRecord.id,
    isNew: true,
  };
}

export async function deleteMessage(
  messageId: number,
  authorId: number,
): Promise<boolean> {
  const existingMessage = await database.singleRecordAction<Message>({
    action: 'findOne',
    condition: {
      authorId,
      id: messageId,
    },
    table: TABLES.messages,
  });
  if (!existingMessage) {
    return false;
  }
  await database.singleRecordAction<void>({
    action: 'destroy',
    condition: {
      authorId,
      id: messageId,
    },
    table: TABLES.messages,
  });
  return true;
}

export async function findUsers(
  search: string,
  userId: number,
  pagination: Pagination,
): Promise<PaginatedResult> {
  const [[{ count: totalCount }], results] = await Promise.all([
    database.Instance.query<CountResult>(
      `SELECT COUNT(*) FROM users
        WHERE id <> :userId AND login ILIKE :search;
      `,
      {
        replacements: {
          search: `%${search}%`,
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
    database.Instance.query<Result>(
      `SELECT id, login FROM users
        WHERE id <> :userId AND login ILIKE :search
        ORDER BY id DESC   
        LIMIT :limit
        OFFSET :offset; 
      `,
      {
        replacements: {
          offset: pagination.offset,
          limit: pagination.limit,
          search: `%${search}%`,
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
  ]);
  return {
    limit: pagination.limit,
    currentPage: pagination.page,
    results,
    totalCount: Number(totalCount),
    totalPages: Math.ceil(totalCount / pagination.limit) || 1,
  };
}

interface GetChatMessagesOptions {
  chatId: number;
  pagination: Pagination;
  userId: number;
}

export async function getChatMessages({
  chatId,
  pagination,
  userId,
}: GetChatMessagesOptions): Promise<PaginatedResult> {
  const [[{ count: totalCount }], results] = await Promise.all([
    database.Instance.query<CountResult>(
      'SELECT COUNT(*) FROM messages WHERE "chatId" = :chatId;',
      {
        replacements: {
          chatId,
        },
        type: QueryTypes.SELECT,
      },
    ),
    database.Instance.query<Result>(
      `SELECT
        m.*,
        u.login,
        (CASE WHEN m."authorId" = :userId THEN true ELSE false END) as "isAuthor"
        FROM messages m LEFT JOIN users u ON m."authorId" = u.id
        WHERE m."chatId" = :chatId
        ORDER BY m.id DESC   
        LIMIT :limit
        OFFSET :offset; 
      `,
      {
        replacements: {
          chatId,
          limit: pagination.limit,
          offset: pagination.offset,
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
  ]);
  return {
    limit: pagination.limit,
    currentPage: pagination.page,
    results,
    totalCount: Number(totalCount),
    totalPages: Math.ceil(totalCount / pagination.limit) || 1,
  };
}

export async function getChat(chatId: number): Promise<Result> {
  const [result] = await database.Instance.query<Result>(
    `WITH data AS (
      SELECT
        uc."chatId",
        uc."createdAt" as "joinedChat",
        u."createdAt",
        u.id,
        u.login
      FROM user_chats uc 
      LEFT JOIN users u ON u.id = uc."userId"
      WHERE uc."chatId" = :chatId
    ) SELECT c.*, json_agg(d.*) AS users
      FROM data d
      LEFT JOIN chats c ON d."chatId" = c.id
      GROUP BY c.id;
    `,
    {
      replacements: {
        chatId,
      },
      type: QueryTypes.SELECT,
    },
  );
  return result;
}

interface ChatUser {
  id: number;
  isOnline: boolean;
  joinedChat: string;
  login: string;
}

interface LatestMessage {
  authorId: number;
  authorLogin: string;
  createdAt: string;
  text: string;
}

interface GetChatsResult extends Chat {
  latestMessage: LatestMessage | null;
  users: ChatUser[];
}

export async function getChats(
  {
    pagination,
    userId,
  }: {
    pagination: Pagination,
    userId: number,
  },
): Promise<PaginatedResult> {
  const [[{ count: totalCount }], results] = await Promise.all([
    database.Instance.query<CountResult>(
      `SELECT COUNT(*) FROM user_chats
        WHERE "chatHidden" = false AND "userId" = :userId;`,
      {
        replacements: {
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
    // TODO: possibly rewrite, optimize ordering
    database.Instance.query<GetChatsResult>(
      `SELECT
        c.*,
        uc."newMessages",
        (SELECT json_agg(message) FROM (
          SELECT
            m."authorId",
            m."createdAt",
            m.text,
            u.login AS "authorLogin"
            FROM messages m
            LEFT JOIN users u ON u.id = m."authorId"
            WHERE m."chatId" = c.id
            ORDER BY m.id DESC
            LIMIT 1
          ) message
        ) AS "latestMessage",
        (SELECT json_agg(users) FROM (
          SELECT
            u.id,
            (CASE WHEN u.id = :userId THEN true ELSE false END) AS "isOnline",
            ucc."createdAt" as "joinedChat",
            u.login
            FROM user_chats ucc LEFT JOIN users u ON ucc."userId" = u.id
            WHERE ucc."chatId" = c.id
          ) users
        ) AS "users"
        FROM user_chats uc
        LEFT JOIN chats c ON uc."chatId" = c.id
          WHERE uc."chatHidden" = false AND uc."userId" = :userId
          ORDER BY c.id DESC
          LIMIT :limit
          OFFSET :offset;
      `,
      {
        replacements: {
          limit: pagination.limit,
          offset: pagination.offset,
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
  ]);

  const userIds = results.reduce(
    (array, item) => {
      item.users.forEach((user) => {
        if (user.id !== userId) {
          array.push(user.id);
        }
      });
      return array;
    },
    [] as number[],
  );
  const uniqueIds = [...new Set(userIds)];
  const userDeviceKeys = await Promise.all(
    uniqueIds.map(
      (id: number): Promise<string[]> => redis.getKeys(redis.keyFormatter(
        redis.PREFIXES.userDevice,
        `${id}-*`,
      )),
    ),
  );
  const uniqueUserDeviceKeys = [...new Set(userDeviceKeys.flat())];
  const onlineUserIds = uniqueUserDeviceKeys.map(
    (userDeviceKey: string): number => Number(userDeviceKey.split('-').slice(-2)[0]),
  );
  const updatedResults = results.map((result: GetChatsResult): GetChatsResult => {
    const updatedUsers = result.users.map((user: ChatUser): ChatUser => {
      if (onlineUserIds.includes(user.id)) {
        return {
          ...user,
          isOnline: true,
        };
      }
      return user;
    });
    return {
      ...result,
      users: updatedUsers,
    };
  });

  return {
    limit: pagination.limit,
    currentPage: pagination.page,
    results: updatedResults,
    totalCount: Number(totalCount),
    totalPages: Math.ceil(totalCount / pagination.limit) || 1,
  };
}

interface GetLatestMessageUsers {
  chatId: number;
  roomConnectionIds: string[];
  userId: number;
}

interface UserDetails {
  chatHidden: boolean;
  connectionIds: string[];
  isInTheRoom: boolean;
  isOnline: boolean;
  newMessages: number;
  userDeviceKeys: string[];
  userId: number;
}

export async function getUserDetails({
  chatId,
  roomConnectionIds,
  userId,
}: GetLatestMessageUsers): Promise<UserDetails[]> {
  const userChats: UserChat[] = await database.Instance[TABLES.userChats].findAll({
    where: {
      chatId,
      userId: {
        [Op.ne]: userId,
      },
    },
  });

  const userDetails = userChats.map((userChat: UserChat): UserDetails => ({
    chatHidden: userChat.chatHidden,
    connectionIds: [],
    isInTheRoom: false,
    isOnline: false,
    newMessages: userChat.newMessages,
    userDeviceKeys: [],
    userId: userChat.userId,
  }));

  await Promise.all(
    userDetails.map(
      async (details: UserDetails, index: number): Promise<void> => {
        const keys = await redis.getKeys(
          redis.keyFormatter(
            redis.PREFIXES.userDevice,
            `${details.userId}-*`,
          ),
        );
        if (keys.length > 0) {
          const connectionIds = await Promise.all(
            keys.map((key: string): Promise<string> => redis.getValue(key)),
          );
          userDetails[index].connectionIds = connectionIds;
          userDetails[index].isInTheRoom = roomConnectionIds.some(
            (connectionId: string): boolean => connectionIds.includes(connectionId),
          );
          userDetails[index].isOnline = true;
          userDetails[index].userDeviceKeys = keys;
        }
      },
    ),
  );

  return userDetails;
}

export async function hideChat(
  chatId: number,
  userId: number,
): Promise<void> {
  return database.Instance[TABLES.userChats].update(
    {
      chatHidden: true,
    },
    {
      where: {
        chatId,
        userId,
      },
    },
  );
}

export async function incrementMessageCountAndShowChat(
  userId: number,
  chatId: number,
  count: UserDetails[],
): Promise<void[]> {
  return Promise.all(
    count.map(
      (
        details: UserDetails,
      ): Promise<void> => database.Instance[TABLES.userChats].update(
        {
          chatHidden: false,
          newMessages: details.newMessages + 1,
        },
        {
          where: {
            chatId,
            userId: {
              [Op.ne]: userId,
            },
          },
        },
      ),
    ),
  );
}

export async function saveMessage(
  authorId: number,
  chatId: number,
  text: string,
): Promise<{ message: Result }> {
  const transaction = await database.createTransaction();
  try {
    const message = await database.Instance[TABLES.messages].create(
      {
        authorId,
        chatId,
        text,
      },
      {
        transaction,
      },
    );
    const [result] = await database.Instance.query<Result>(
      `SELECT m.*, u.login FROM messages m
        LEFT JOIN users u on m."authorId" = u.id
        WHERE m.id = :messageId;
      `,
      {
        replacements: {
          messageId: message.id,
        },
        transaction,
        type: QueryTypes.SELECT,
      },
    );
    await transaction.commit();
    return {
      message: {
        ...result,
        isAuthor: true,
      },
    };
  } catch (transactionError) {
    transaction.rollback();
    throw transactionError;
  }
}
