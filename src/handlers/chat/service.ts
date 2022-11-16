import { QueryTypes } from 'sequelize';

import { CHAT_TYPES } from '../../configuration';
import database, {
  type CountResult,
  type Message,
  type PaginatedResult,
  type Result,
  type UserChat,
  type User,
  TABLES,
} from '../../database';
import type { Pagination } from '../../types';

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
    database.Instance.query<Result>(
      `SELECT
        c.*,
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

  return {
    limit: pagination.limit,
    currentPage: pagination.page,
    results,
    totalCount: Number(totalCount),
    totalPages: Math.ceil(totalCount / pagination.limit) || 1,
  };
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

export async function saveMessage(
  authorId: number,
  chatId: number,
  text: string,
): Promise<{ hiddenChats: number[], message: Result }> {
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
    const [[result], hiddenChats] = await Promise.all([
      database.Instance.query<Result>(
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
      ),
      database.Instance[TABLES.userChats].findAll({
        transaction,
        where: {
          chatHidden: true,
          chatId,
        },
      }),
    ]);
    if (hiddenChats.length > 0) {
      await database.Instance[TABLES.userChats].update(
        {
          chatHidden: false,
        },
        {
          transaction,
          where: {
            chatId,
          },
        },
      );
    }
    await transaction.commit();

    return {
      hiddenChats: hiddenChats.map(
        (chat: UserChat): number => chat.userId,
      ),
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
