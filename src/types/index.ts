import type { Socket } from 'socket.io';

export interface Payload {
  [key: string]: number | string;
  limit?: number;
  offset?: number;
  page?: number;
  token?: string;
}

export interface HandlerData {
  connection: Socket;
  payload?: Payload;
  userId?: number;
}
