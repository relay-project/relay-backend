import { QueryTypes } from 'sequelize';

import { CHAT_TYPES } from '../../configuration';
import database, {
  CountResult,
  PaginatedResult,
  Result,
  TABLES,
} from '../../database';

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

export async function createChat(userId: number, invited: number[]): Promise<void[]> {
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

  return Promise.all(invited.map(async (id: number): Promise<void> => {
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
): Promise<PaginatedResult> {
  const [count, results] = await Promise.all([
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
    count: Number(count[0].count),
    results,
  };
}

export async function getChats(
  userId: number,
  limit: number,
  offset: number,
): Promise<{ count: object[], results: object[] }> {
  const [count, results] = await Promise.all([
    database.Instance.query(
      'SELECT COUNT(*) FROM user_chats WHERE "userId" = :userId;',
      {
        replacements: {
          userId,
        },
        type: QueryTypes.SELECT,
      },
    ),
    database.Instance.query(
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
  // TODO: return data properly
  return {
    count,
    results,
  };
}

export async function saveMessage(
  authorId: number,
  chatId: number,
  text: string,
): Promise<void> {
  return database.Instance[TABLES.messages].create({
    authorId,
    chatId,
    text,
  });
}
