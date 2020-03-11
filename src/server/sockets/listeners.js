export default function initListeners(io) {
  io.on('connection', (userSocket) => {
    console.log('User Connected');

    // TODO: add to event room

    // TODO: leave from event room

    userSocket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}
