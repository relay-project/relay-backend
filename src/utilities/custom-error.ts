import type { ValidationError } from 'joi';

import {
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../configuration';

class CustomError extends Error {
  details?: string | ValidationError;

  info: string;

  status: number;

  constructor({
    details = null,
    info = RESPONSE_MESSAGES.validationError,
    status = RESPONSE_STATUSES.badRequest,
  }) {
    if (!info) {
      throw new Error('Error information is required!');
    }

    super(info);

    this.info = info;
    this.status = status;

    if (details) {
      this.details = details;
    }
  }
}

export default CustomError;
