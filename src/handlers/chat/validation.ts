import joi from 'joi';

export { type ValidationResult } from 'joi';

export const inviteUserSchema = joi.object({
  userId: joi
    .number()
    .required(),
});

export default joi.object({
  search: joi
    .string()
    .required(),
});
