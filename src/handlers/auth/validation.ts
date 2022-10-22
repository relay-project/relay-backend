import joi from 'joi';

import {
  MAX_LOGIN_LENGTH,
  MAX_RECOVERY_ANSWER_LENGTH,
  MAX_RECOVERY_QUESTION_LENGTH,
} from '../../configuration';

export const signInSchema = joi.object({
  login: joi
    .string()
    .alphanum()
    .max(MAX_LOGIN_LENGTH)
    .required(),
  password: joi
    .string()
    .required(),
});

export const signUpSchema = signInSchema.keys({
  deviceId: joi
    .string()
    .alphanum()
    .required(),
  recoveryAnswer: joi
    .string()
    .max(MAX_RECOVERY_ANSWER_LENGTH)
    .required(),
  recoveryQuestion: joi
    .string()
    .max(MAX_RECOVERY_QUESTION_LENGTH)
    .required(),
});
