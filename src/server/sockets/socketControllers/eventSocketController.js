export function joinEvent(eventId, userSocket, io) {
  // TODO : If user is valid
  // TODO : If event is valid
  // TODO : If event is ongoing

  // TODO: If event does not exist - create it

  userSocket.join(eventId);
  console.log(`User just joined event ${eventId}`);
}

export function leaveEvent(eventId, userSocket, io) {
  userSocket.leave(eventId);
  console.log(`User just left the event ${eventId}`);
}
