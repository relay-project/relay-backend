import createRoomID, { ROOM_PREFIXES } from '../../utilities/rooms';
import CustomError from '../../utilities/custom-error';
import {
  EVENTS,
  RESPONSE_MESSAGES,
  RESPONSE_STATUSES,
} from '../../configuration';
import type { HandlerData } from '../../types';
import response from '../../utilities/response';
import { sendMessageSchema, type ValidationResult } from './validation';
import * as service from './service';

interface SendMessagePayload {
  chatId: number;
  text: string;
}

interface UserDetails {
  chatHidden: boolean;
  connectionIds: string[];
  isInTheRoom: boolean;
  isOnline: boolean;
  newMessages: number;
  userDeviceKeys: string[];
  userId: number;
}

export const authorize = true;
export const event = EVENTS.SEND_MESSAGE;

export async function handler({
  connection,
  payload,
  server,
  userId,
}: HandlerData): Promise<boolean> {
  try {
    const {
      error: validationError,
      value,
    }: ValidationResult<SendMessagePayload> = sendMessageSchema.validate(
      payload,
    );
    if (validationError) {
      throw new CustomError({
        details: validationError,
      });
    }

    const { chatId, text } = value;
    const chatAccess = await service.checkChatAccess(chatId, userId);
    if (!chatAccess) {
      throw new CustomError({
        info: RESPONSE_MESSAGES.invalidChatId,
        status: RESPONSE_STATUSES.badRequest,
      });
    }

    const { message } = await service.saveMessage(userId, chatId, text);
    const roomId = createRoomID(ROOM_PREFIXES.chat, chatId);
    connection.to(roomId).emit(
      EVENTS.INCOMING_CHAT_MESSAGE,
      {
        ...message,
        isAuthor: false,
      },
    );

    const roomSet = server.sockets.adapter.rooms.get(roomId);
    if (roomSet) {
      const roomConnectionIds = [...roomSet].filter(
        (connectionId: string): boolean => connectionId !== connection.id,
      );
      const details = await service.getUserDetails({
        chatId,
        roomConnectionIds,
        userId,
      });
      const [count, notify, showChat]: UserDetails[][] = details.reduce(
        (arrayOfArrays, data) => {
          if (!data.isInTheRoom) {
            arrayOfArrays[0].push(data);
          }
          if (!data.chatHidden && !data.isInTheRoom && data.isOnline) {
            arrayOfArrays[1].push(data);
          }
          if (data.chatHidden && data.isOnline) {
            arrayOfArrays[2].push(data);
          }
          return arrayOfArrays;
        },
        [[], [], []],
      );
      await service.incrementMessageCountAndShowChat(userId, chatId, count);
      notify.forEach((data: UserDetails): void => {
        data.connectionIds.forEach((connectionId: string): void => {
          connection.to(connectionId).emit(
            EVENTS.INCOMING_LATEST_MESSAGE,
            {
              ...message,
              isAuthor: false,
              newMessages: data.newMessages + 1,
            },
          );
        });
      });

      if (showChat.length > 0) {
        const chat = await service.getChat(chatId);
        showChat.forEach((data: UserDetails): void => {
          data.connectionIds.forEach((connectionId: string): void => {
            connection.to(connectionId).emit(
              EVENTS.INCOMING_SHOW_HIDDEN_CHAT,
              {
                ...chat,
                latestMessage: {
                  ...message,
                  isAuthor: false,
                },
                newMessages: data.newMessages + 1,
              },
            );
          });
        });
      }
    }

    return response({
      connection,
      event,
      payload: message,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return response({
        connection,
        details: error.details || '',
        event,
        info: error.info,
        status: error.status,
      });
    }
    return response({
      connection,
      error,
      event,
    });
  }
}
