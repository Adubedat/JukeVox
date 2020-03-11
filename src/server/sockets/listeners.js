import { joinEvent, leaveEvent } from './socketControllers/eventSocketController';

export default function initListeners(io) {
  io.on('connection', (userSocket) => {
    console.log('User Connected');

    userSocket.on('join_event', (eventId) => {
      joinEvent(eventId, userSocket, io);
    });

    userSocket.on('leave_event', (eventId) => {
      leaveEvent(eventId, userSocket, io);
    });

    userSocket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}
