import joi from 'joi';

export { type ValidationResult } from 'joi';

export default joi.object({
  search: joi
    .string()
    .required(),
});
