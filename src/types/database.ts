interface Base {
  createdAt: string;
  id: number;
  updatedAt: string;
}

export type ChatTypes = 'group' | 'private';

export type UserRoles = 'admin' | 'user';

export interface Chat extends Base {
  createdBy: number;
  name: string;
  type: ChatTypes;
}

export interface Device extends Base {
  deviceId: string;
  deviceName: string;
  userId: number;
}

export interface Message extends Base {
  authorId: number;
  chatId: number;
  edited: boolean;
  text: string;
}

export interface Password extends Base {
  hash: string;
  userId: number;
}

export interface Secret extends Base {
  secret: string;
  userId: number;
}

export interface User extends Base {
  failedLoginAttempts: number;
  login: string;
  recoveryAnswer: string;
  recoveryQuestion: string;
  role: UserRoles;
}

export interface UserChat extends Base {
  chatHidden: boolean;
  chatId: number;
  userId: number;
}

export interface CountResult {
  count: number;
}

export interface Result extends Base {
  [key: string]: any;
}

export interface PaginatedResult {
  currentPage: number;
  limit: number;
  results: Result[];
  totalCount: number;
  totalPages: number;
}
