import moment from 'moment';
import Event from '../../models/eventModel';
import DATETIME_FORMAT from '../../constants';

export async function joinEvent(userId, eventId, socket, io) {
  try {
    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      socket.emit('exception', {
        code: 404, message: 'Event not found', event: 'join_event', eventId,
      });
      return;
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      socket.emit('exception', {
        code: 403, message: 'Forbidden. User not going', event: 'join_event', eventId,
      });
      return;
    }

    socket.join(eventId);
    socket.emit('success', {
      code: 200, message: 'Successfully joined event', event: 'join_event', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'join_event', eventId,
    });
  }
}

export async function leaveEvent(userId, eventId, socket, io) {
  try {
    socket.leave(eventId);
    console.log(`User ${userId} just left the event ${eventId}`);
    socket.emit('success', {
      code: 200, message: 'Successfully left event', event: 'leave_event', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'leave_event', eventId,
    });
  }
}
