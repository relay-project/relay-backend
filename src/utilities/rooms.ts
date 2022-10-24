export const ROOM_PREFIXES = {
  chat: 'chat',
  user: 'user',
};

export default function createRoomID(
  prefix: string,
  entityId: number,
): string {
  return `${prefix}-${entityId}`;
}
