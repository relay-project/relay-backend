import joi from 'joi';

import {
  MAX_DEVICE_ID_LENGTH,
  MAX_DEVICE_NAME_LENGTH,
  MAX_LOGIN_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_RECOVERY_ANSWER_LENGTH,
  MAX_RECOVERY_QUESTION_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '../../configuration';

export { type ValidationResult } from 'joi';

export const loginSchema = joi.object({
  login: joi
    .string()
    .alphanum()
    .lowercase()
    .max(MAX_LOGIN_LENGTH)
    .required(),
});

export const recoveryFinalSchema = joi.object({
  newPassword: joi
    .string()
    .max(MAX_PASSWORD_LENGTH)
    .min(MIN_PASSWORD_LENGTH)
    .required(),
  recoveryAnswer: joi
    .string()
    .required(),
  userId: joi
    .number()
    .required(),
});

export const signInSchema = loginSchema.keys({
  password: joi
    .string()
    .required(),
});

export const signUpSchema = loginSchema.keys({
  deviceId: joi
    .string()
    .alphanum()
    .max(MAX_DEVICE_ID_LENGTH)
    .required(),
  deviceName: joi
    .string()
    .alphanum()
    .max(MAX_DEVICE_NAME_LENGTH)
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
