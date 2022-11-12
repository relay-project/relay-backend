import CustomError from '../../utilities/custom-error';
import { EVENTS } from '../../configuration';
import { findUsersSchema, type ValidationResult } from './validation';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import * as service from './service';

interface FindUsersPayload {
  search: string;
}

export const authorize = true;
export const event = EVENTS.FIND_USERS;
export const paginated = true;

export async function handler({
  connection,
  pagination,
  payload,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<FindUsersPayload> = findUsersSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const { search } = value;
    const users = await service.findUsers(
      search,
      userId,
      pagination,
    );

    return response({
      connection,
      event,
      payload: users,
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
