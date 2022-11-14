import joi from 'joi';

export { type ValidationResult } from 'joi';

export const createChatSchema = joi.object({
  chatName: joi
    .string()
    .allow('', null),
  invited: joi
    .array()
    .items(joi.number())
    .required(),
});

export const deleteMessageSchema = joi.object({
  chatId: joi
    .number()
    .required(),
  messageId: joi
    .number()
    .required(),
});

export const findUsersSchema = joi.object({
  search: joi
    .string()
    .required(),
});

export const getChatMessagesSchema = joi.object({
  chatId: joi
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
