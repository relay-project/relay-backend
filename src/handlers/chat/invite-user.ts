import CustomError from '../../utilities/custom-error';
// import database from '../../database';
import type { HandlerOptions } from '../../types';
import response from '../../utilities/response';
// import { TABLES } from '../../configuration';
import { inviteUserSchema, type ValidationResult } from './validation';
import { TABLES } from '../../configuration';

interface InviteUserPayload {
  userId: number;
}

export default async function inviteUserHandler({
  connection,
  event,
  payload,
  // userId,
}: HandlerOptions): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
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
