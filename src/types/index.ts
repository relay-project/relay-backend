import type { Socket } from 'socket.io';

export interface HandlerOptions {
  connection: Socket;
  event: string;
  payload: {
    [key: string]: any;
    token?: string;
  };
  userId?: number;
}
