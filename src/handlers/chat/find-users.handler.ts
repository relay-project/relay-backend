import CustomError from '../../utilities/custom-error';
// import database from '../../database';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
// import { TABLES } from '../../configuration';
import findUsersSchema, { type ValidationResult } from './validation';
import { EVENTS } from '../../configuration';

interface FindUsersPayload {
  search: string;
}

export const authorize = true;
export const event = EVENTS.FIND_USERS;

export async function handler({
  connection,
  payload,
  // userId,
}: HandlerData): Promise<boolean> {
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
