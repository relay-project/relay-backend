import { QueryTypes } from 'sequelize';

import database, { TABLES } from '../../database';

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
          limit,
          offset,
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
