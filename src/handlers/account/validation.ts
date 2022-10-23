import joi from 'joi';

export default joi.object({
  newPassword: joi
    .string()
    .required(),
  oldPassword: joi
    .string()
    .required(),
});
