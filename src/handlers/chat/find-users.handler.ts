import CustomError from '../../utilities/custom-error';
// import database from '../../database';
import type { HandlerOptions } from '../../types';
import response from '../../utilities/response';
// import { TABLES } from '../../configuration';
import findUsersSchema, { type ValidationResult } from './validation';

interface FindUsersPayload {
  search: string;
}

export default async function findUsersHandler({
  connection,
  event,
  payload,
  // userId,
}: HandlerOptions): Promise<boolean> {
  try {
    const {
      error: validationError,
      // value,
    }: ValidationResult<FindUsersPayload> = findUsersSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    // const { search } = value;

    return response({
      connection,
      event,
      payload: {

      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return response({
        connection,
        details: error.details || '',
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
