import type { Socket } from 'socket.io';
import { ValidationError } from 'joi';

import log from './logger';
import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../configuration';

interface ResponseArguments {
  connection: Socket;
  details?: null | string | ValidationError,
  event: string;
  error?: Error | null;
  info?: string;
  payload?: null | object;
  status?: number;
}

type ResponseObject = Pick<
  ResponseArguments, 'details' | 'event' | 'info' | 'payload' | 'status'
> & {
  datetime: number;
}

export default function response({
  connection,
  details = null,
  error = null,
  event,
  info = RESPONSE_MESSAGES.ok,
  payload = null,
  status = RESPONSE_STATUSES.ok,
}: ResponseArguments): boolean {
  const responseObject: ResponseObject = {
    datetime: Date.now(),
    event,
    info: error ? RESPONSE_MESSAGES.internalServerError : info,
    status: error ? RESPONSE_STATUSES.internalServerError : status,
  };
  if (error) {
    log(`${connection.id} / ${event} - ${error}`);
  }
  if (details) {
    if (typeof details === 'string') {
      responseObject.details = details;
    }
    if (typeof details === 'object' && details instanceof ValidationError) {
      responseObject.details = details.message;
    }
  }
  if (payload) {
    responseObject.payload = payload;
  }

  return connection.emit(
    event,
    responseObject,
  );
}
