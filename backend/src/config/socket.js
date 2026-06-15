import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { User } from '../models/User.js';

let ioInstance;

export function registerSocket(io) {
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select('role restaurant isActive');
      if (!user || !user.isActive || !user.restaurant) return next(new Error('Invalid session'));

      socket.user = {
        id: String(user._id),
        role: user.role,
        restaurantId: String(user.restaurant)
      };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, restaurantId } = socket.user;
    socket.join(`user:${id}`);
    socket.join(`restaurant:${restaurantId}`);
    socket.join(`restaurant:${restaurantId}:role:${role}`);
  });
}

export function emitRestaurant(restaurantId, event, payload) {
  if (!ioInstance || !restaurantId) return;
  ioInstance.to(`restaurant:${restaurantId}`).emit(event, payload);
}

export function emitKitchen(restaurantId, event, payload) {
  if (!ioInstance || !restaurantId) return;
  ioInstance.to(`restaurant:${restaurantId}:role:chef`).emit(event, payload);
}
