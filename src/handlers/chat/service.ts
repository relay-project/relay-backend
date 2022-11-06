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
