import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useSocket() {
  const { token, user } = useAuth();
  const socket = useMemo(
    () =>
      io(API_URL, {
        autoConnect: false,
        reconnectionAttempts: 3,
        reconnectionDelay: 600,
        timeout: 5000,
        transports: ['websocket']
      }),
    []
  );

  useEffect(() => {
    if (!token || !user) return;
    socket.auth = { token };
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket, token, user]);

  return socket;
}
