import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useSocket() {
  const { token, user } = useAuth();
  const socket = useMemo(() => io(API_URL, { autoConnect: false }), []);

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
