import type { RoomEvent } from "@/types/room";

type Listener = (event: RoomEvent) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeRoomEvents(auctionId: string, listener: Listener) {
  const roomListeners = listeners.get(auctionId) ?? new Set<Listener>();
  roomListeners.add(listener);
  listeners.set(auctionId, roomListeners);

  return () => {
    roomListeners.delete(listener);
    if (!roomListeners.size) listeners.delete(auctionId);
  };
}

export function publishRoomEvent(event: RoomEvent) {
  listeners.get(event.auctionId)?.forEach((listener) => {
    try {
      listener(event);
    } catch {
      /* A disconnected stream must not affect the room mutation. */
    }
  });
}