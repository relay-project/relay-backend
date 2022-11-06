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
