import joi from 'joi';

import {
  MAX_PASSWORD_LENGTH,
  MAX_RECOVERY_ANSWER_LENGTH,
  MAX_RECOVERY_QUESTION_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '../../configuration';

export const updatePasswordSchema = joi.object({
  newPassword: joi
    .string()
    .max(MAX_PASSWORD_LENGTH)
    .min(MIN_PASSWORD_LENGTH)
    .required(),
  oldPassword: joi
    .string()
    .required(),
});

export const updateRecoveryDataSchema = joi.object({
  newRecoveryAnswer: joi
    .string()
    .max(MAX_RECOVERY_ANSWER_LENGTH)
    .required(),
  newRecoveryQuestion: joi
    .string()
    .max(MAX_RECOVERY_QUESTION_LENGTH)
    .required(),
});
