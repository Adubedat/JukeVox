import Event from '../../models/eventModel';

export async function joinEvent(userId, eventId, socket, io) {
  const event = await Event.getEvent(eventId);

  if (event[0] === undefined) {
    // TODO: Throw error
    console.log('No event found with this ID');
    return;
  }

  const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
  if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
    // TODO: Throw error
    console.log('Can only connect if going to event');
  }

  // TODO : If event is ongoing

  socket.join(eventId);
  console.log(`User ${userId} just joined event ${eventId}`);
}

export function leaveEvent(userId, eventId, socket, io) {
  socket.leave(eventId);
  console.log(`User ${userId} just left the event ${eventId}`);
}
