const { env: ev } = process;

export const ALLOWED_ORIGINS: string[] = ev.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((value: string): string => value.trim())
  : [];

export const CHAT_TYPES = {
  group: 'group',
  private: 'private',
};

export const DATABASE = {
  dialect: 'postgres',
  host: process.env.DATABASE_HOST,
  logging: false,
  name: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
};

export const ENVS = {
  development: 'development',
  production: 'production',
};

export const {
  APPLICATION_NAME = 'RELAY',
  MIGRATIONS_ON_STARTUP = 'enabled',
  NODE_ENV = ENVS.development,
} = ev;

export const EVENTS = {
  COMPLETE_LOGOUT: 'complete-logout',
  CONNECTION: 'connection',
  CREATE_CHAT: 'create-chat',
  DELETE_ACCOUNT: 'delete-account',
  DELETE_MESSAGE: 'delete-message',
  DEVICE_DISCONNECTED: 'device-disconnected',
  DISCONNECT: 'disconnect',
  DISCONNECTING: 'disconnecting',
  FIND_USERS: 'find-users',
  GET_CHAT: 'get-chat',
  GET_CHAT_MESSAGES: 'get-chat-messages',
  GET_CHATS: 'get-chats',
  HIDE_CHAT: 'hide-chat',
  INCOMING_CHAT_MESSAGE: 'incoming-chat-message',
  LEAVE_ROOM: 'leave-room',
  RECOVERY_FINAL_STAGE: 'recovery-final-stage',
  RECOVERY_INITIAL_STAGE: 'recovery-inital-stage',
  ROOM_DELETE_MESSAGE: 'room-delete-message',
  ROOM_UPDATE_MESSAGE: 'room-update-message',
  SEND_MESSAGE: 'send-message',
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
  UPDATE_PASSWORD: 'update-password',
  UPDATE_RECOVERY_DATA: 'update-recovery-data',
  USER_CONNECTED: 'USER_CONNECTED',
};

export const MAX_DEVICE_ID_LENGTH = 64;

export const MAX_DEVICE_NAME_LENGTH = 64;

export const MAX_FAILED_LOGIN_ATTEMPTS = 10;

export const MAX_LOGIN_LENGTH = 32;

export const MAX_PASSWORD_LENGTH = 32;

export const MAX_RECOVERY_ANSWER_LENGTH = 256;

export const MAX_RECOVERY_QUESTION_LENGTH = 256;

export const MIN_PASSWORD_LENGTH = 8;

export const PORT = Number(ev.PORT) || 5000;

export const REDIS = {
  flushOnLaunch: process.env.REDIS_FLUSH_ON_LAUNCH || 'no',
  host: process.env.REDIS_HOST || 'localhost',
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT || 6379,
};

export const RESPONSE_MESSAGES = {
  accessDenied: 'ACCESS_DENIED',
  accountSuspended: 'ACCOUNT_SUSPENDED',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  invalidData: 'INVALID_DATA',
  invalidChatId: 'INVALID_CHAT_ID',
  invalidMessageId: 'INVALID_MESSAGE_ID',
  loginAlreadyInUse: 'LOGIN_ALREADY_IN_USE',
  missingData: 'MISSING_DATA',
  missingToken: 'MISSING_TOKEN',
  ok: 'OK',
  oldPasswordIsInvalid: 'OLD_PASSWORD_IS_INVALID',
  privateChatAlreadyExists: 'PRIVATE_CHAT_ALREADY_EXISTS',
  unauthorized: 'UNAUTHORIZED',
  validationError: 'VALIDATION_ERROR',
};

export const RESPONSE_STATUSES = {
  badRequest: 400,
  forbidden: 403,
  internalServerError: 500,
  ok: 200,
  unauthorized: 401,
};

export const ROLES = {
  admin: 'admin',
  user: 'user',
};

export const TABLES = {
  chatInvitations: 'chat_invitations',
  chats: 'chats',
  devices: 'devices',
  messages: 'messages',
  passwords: 'passwords',
  secrets: 'secrets',
  users: 'users',
  userChats: 'user_chats',
};
