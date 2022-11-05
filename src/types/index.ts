import type { Socket } from 'socket.io';

export interface HandlerOptions {
  connection: Socket;
  event: string;
  payload: Payload;
  userId?: number;
}

export interface Payload {
  [key: string]: number | string;
  token?: string;
}
