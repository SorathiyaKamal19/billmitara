let ioInstance;

export function registerSocket(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    socket.on('join:role', (role) => socket.join(role));
    socket.on('join:restaurant', (restaurantId) => socket.join(`restaurant:${restaurantId}`));
  });
}

export function emitRestaurant(restaurantId, event, payload) {
  if (!ioInstance || !restaurantId) return;
  ioInstance.to(`restaurant:${restaurantId}`).emit(event, payload);
}

export function emitKitchen(restaurantId, event, payload) {
  if (!ioInstance || !restaurantId) return;
  ioInstance.to(`restaurant:${restaurantId}`).to('chef').emit(event, payload);
}
