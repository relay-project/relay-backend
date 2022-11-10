import { QueryTypes } from 'sequelize';

import { CHAT_TYPES } from '../../configuration';
import database, {
  type CountResult,
  type PaginatedResult,
  type Result,
  TABLES,
} from '../../database';
import type { Pagination } from '../../types';

export async function checkChatAccess(
  chatId: number,
  userId: number,
): Promise<boolean> {
  const userAccess = await database.singleRecordAction({
    action: 'findOne',
    condition: {
      chatId,
      userId,
    },
    table: TABLES.userChats,
  });
  return !!userAccess;
}

export async function createChat(
  userId: number,
  invited: number[],
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
      return {
        chatId: existingChat.id,
        isNew: false,
      };
    }
  }

  const chatRecord = await database.Instance[TABLES.chats].create({
    createdBy: userId,
    name: '',
    type: invited.length > 1
      ? CHAT_TYPES.group
      : CHAT_TYPES.private,
  });

  await database.Instance[TABLES.userChats].create({
    chatId: chatRecord.id,
    userId,
  });

  await Promise.all(invited.map(async (id: number): Promise<void> => {
    const existingUser = await database.singleRecordAction({
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
  const existingMessage = await database.singleRecordAction({
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
  await database.singleRecordAction({
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
  limit: number,
  offset: number,
  page: number,
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
      `SELECT "createdAt", id, login FROM users
        WHERE id <> :userId AND login ILIKE :search
        ORDER BY id DESC   
        LIMIT :limit
        OFFSET :offset; 
      `,
      {
        replacements: {
          offset,
          limit,
          search: `%${search}%`,
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
  ]);
  return {
    limit,
    currentPage: page,
    results,
    totalCount: Number(totalCount),
    totalPages: Math.ceil(totalCount / limit) || 1,
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

export async function getChat(
  chatId: number,
): Promise<Result | void> {
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
  userId: number,
  limit: number,
  offset: number,
  page: number,
): Promise<PaginatedResult> {
  const [[{ count: totalCount }], results] = await Promise.all([
    database.Instance.query<CountResult>(
      'SELECT COUNT(*) FROM user_chats WHERE "userId" = :userId;',
      {
        replacements: {
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
    database.Instance.query<Result>(
      `SELECT c.* FROM user_chats uc LEFT JOIN chats c ON uc."chatId" = c.id
        WHERE uc."userId" = :userId
        ORDER BY id DESC   
        LIMIT :limit
        OFFSET :offset; 
      `,
      {
        replacements: {
          limit,
          offset,
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
  ]);
  return {
    limit,
    currentPage: page,
    results,
    totalCount: Number(totalCount),
    totalPages: Math.ceil(totalCount / limit) || 1,
  };
}

export async function saveMessage(
  authorId: number,
  chatId: number,
  text: string,
): Promise<Result> {
  return database.Instance[TABLES.messages].create({
    authorId,
    chatId,
    text,
  });
}
