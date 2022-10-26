import joi from 'joi';

import {
  MAX_LOGIN_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_RECOVERY_ANSWER_LENGTH,
  MAX_RECOVERY_QUESTION_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '../../configuration';

const base = joi.object({
  login: joi
    .string()
    .alphanum()
    .max(MAX_LOGIN_LENGTH)
    .required(),
});

export const signInSchema = base.keys({
  password: joi
    .string()
    .required(),
});

export const signUpSchema = base.keys({
  deviceId: joi
    .string()
    .alphanum()
    .required(),
  deviceName: joi
    .string()
    .alphanum()
    .required(),
  password: joi
    .string()
    .max(MAX_PASSWORD_LENGTH)
    .min(MIN_PASSWORD_LENGTH)
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
