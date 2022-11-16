import type { Socket } from 'socket.io';

export interface Connection extends Socket {
  isFirstRequest: boolean;
}

export interface Pagination {
  limit: number;
  page: number;
  offset: number;
}

export interface Payload {
  [key: string]: number | string;
  limit?: number;
  page?: number;
  token?: string;
}

export interface HandlerData {
  connection: Socket;
  deviceId?: string;
  pagination?: Pagination;
  payload?: Payload;
  userId?: number;
}
