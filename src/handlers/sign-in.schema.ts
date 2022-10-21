import joi from 'joi';

import { MAX_LOGIN_LENGTH } from '../configuration';

export default joi.object({
  login: joi
    .string()
    .alphanum()
    .max(MAX_LOGIN_LENGTH)
    .required(),
  password: joi
    .string()
    .required(),
});
