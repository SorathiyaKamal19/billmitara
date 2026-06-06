import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useSocket() {
  const { user } = useAuth();
  const socket = useMemo(() => io(API_URL, { autoConnect: false }), []);

  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit('join:role', user.role);
    socket.emit('join:restaurant', user.restaurant?._id);
    return () => {
      socket.disconnect();
    };
  }, [socket, user]);

  return socket;
}
