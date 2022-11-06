import joi from 'joi';

export { type ValidationResult } from 'joi';

export const deleteMessageSchema = joi.object({
  messageId: joi
    .number()
    .required(),
});

export const inviteUserSchema = joi.object({
  userId: joi
    .number()
    .required(),
});

export const sendMessageSchema = joi.object({
  chatId: joi
    .number()
    .required(),
  text: joi
    .string()
    .required(),
});

export const updateMessageSchema = joi.object({
  messageId: joi
    .number()
    .required(),
  text: joi
    .string()
    .required(),
});

export default joi.object({
  search: joi
    .string()
    .required(),
});
