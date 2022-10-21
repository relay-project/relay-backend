import * as joi from 'joi';

export default joi.object({
  login: joi
    .string()
    .alphanum()
    .max(32)
    .min(2)
    .required(),
  password: joi
    .string()
    .required(),
});
