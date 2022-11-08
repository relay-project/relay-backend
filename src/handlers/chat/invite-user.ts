import CustomError from '../../utilities/custom-error';
// import database from '../../database';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
// import { TABLES } from '../../configuration';
import { inviteUserSchema, type ValidationResult } from './validation';
import { EVENTS } from '../../configuration';

interface InviteUserPayload {
  userId: number;
}

export const authorize = true;
export const event = EVENTS.INVITE_USER;

export async function handler({
  connection,
  payload,
  // userId,
}: HandlerData): Promise<boolean> {
  try {
    const {
      error: validationError,
      // value,
    }: ValidationResult<InviteUserPayload> = inviteUserSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    // const { userId: invitedId } = value;

    // const isAlreadyInvited = await service.singleRecordAction({
    //   action: 'findOne',
    //   condition: {

    //   },
    //   table: TABLES.chatInvitations,
    // });

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
