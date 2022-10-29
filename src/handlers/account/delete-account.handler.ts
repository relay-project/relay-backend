import database from '../../database';
import type { HandlerOptions } from '../../types';
import response from '../../utilities/response';
import { TABLES } from '../../configuration';

export default async function deleteAccountHandler({
  connection,
  event,
  userId,
}: HandlerOptions): Promise<boolean> {
  try {
    await database.Instance[TABLES.users].destroy({
      where: {
        id: userId,
      },
    });

    return response({
      connection,
      event,
    });
  } catch (error) {
    return response({
      connection,
      error,
      event,
    });
  }
}
