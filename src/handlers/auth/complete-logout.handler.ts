import { createHash } from './service';
import CustomError from '../../utilities/custom-error';
import database from '../../database';
import type { HandlerOptions } from '../../types';
import response from '../../utilities/response';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
  TABLES,
} from '../../configuration';

export default async function completeLogoutHandler({
  connection,
  event,
  userId,
}: HandlerOptions): Promise<boolean> {
  try {
    const secretRecord = await database.Instance[TABLES.secrets].findOne({
      where: {
        userId,
      },
    });
    if (!secretRecord) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.unauthorized,
        status: RESPONSE_STATUSES.unauthorized,
      });
    }

    const newSecretHash = await createHash(`${secretRecord.userId}-${Date.now()}`);
    await database.Instance[TABLES.secrets].update(
      {
        secret: newSecretHash,
      },
      {
        where: {
          userId,
        },
      },
    );

    return response({
      connection,
      event,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return response({
        connection,
        details: error.details || null,
        event,
        info: error.info,
        status: error.status,
      });
    }
    return response({
      connection,
      error,
      event,
    });
  }
}
