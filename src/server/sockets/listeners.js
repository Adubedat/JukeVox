import jwt from 'jsonwebtoken';
import { joinEvent, leaveEvent } from './socketControllers/eventSocketController';

export default function initListeners(io) {
  io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error'));
        }
        socket.decoded = decoded;
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  })
    .on('connection', (socket) => {
      // connection now authenticated to receive further events
      const { userId } = socket.decoded;

      console.log(`User ${userId} Connected`);

      socket.on('join_event', (data) => {
        const { eventId } = data;
        if (eventId === undefined) {
          socket.emit('exception', { code: 401, message: 'Missing data', event: 'join_event' });
        } else {
          joinEvent(userId, eventId, socket, io);
        }
      });

      socket.on('leave_event', (data) => {
        const { eventId } = data;
        if (eventId === undefined) {
          socket.emit('exception', { code: 401, message: 'Missing data', event: 'leave_event' });
        } else {
          leaveEvent(userId, eventId, socket, io);
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });
}
