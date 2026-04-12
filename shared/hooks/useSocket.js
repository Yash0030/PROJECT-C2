import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env?.VITE_WS_URL || 'http://localhost:4000';

let socket = null;

export function getSocket(token) {
  if (!socket && token) {
    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

/**
 * useSocket(token) — returns the shared socket instance.
 * Disconnects on unmount only when the component that created it unmounts.
 */
export function useSocket(token) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    socketRef.current = getSocket(token);
    return () => {};
  }, [token]);

  return socketRef.current;
}
