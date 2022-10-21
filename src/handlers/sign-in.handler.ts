import type { Socket } from 'socket.io';
import type { ValidationResult } from 'joi';

import { createToken } from '../utilities/jwt';
import CustomError from '../utilities/custom-error';
import {
  EVENTS,
} from '../configuration';
import response from '../utilities/response';
import signInSchema from './sign-in.schema';

interface SignInPayload {
  login: string;
  password: string;
}

export default async function signInHandler(
  connection: Socket,
  payload: SignInPayload,
): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<SignInPayload> = signInSchema.validate(payload);
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }
    const token = await createToken(value.login);
    return response({
      connection,
      event: EVENTS.SIGN_IN,
      payload: {
        token,
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return response({
        connection,
        details: error.details || '',
        event: EVENTS.SIGN_IN,
        info: error.info,
        status: error.status,
      });
    }
    return response({
      connection,
      error,
      event: EVENTS.SIGN_IN,
    });
  }
}
