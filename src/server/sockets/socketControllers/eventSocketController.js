import moment from 'moment';
import Event from '../../models/eventModel';
import DATETIME_FORMAT from '../../constants';

export async function joinEvent(userId, eventId, socket, io) {
  try {
    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      socket.emit('exception', { code: 404, message: 'Event not found' });
      return;
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      socket.emit('exception', { code: 403, message: 'Forbidden. User not going' });
      return;
    }

    const timeNow = moment().format(DATETIME_FORMAT);
    if (moment(timeNow).isBefore(event[0].StartDate) || moment(timeNow).isAfter(event[0].EndDate)) {
      socket.emit('exception', { code: 403, message: 'Forbidden. Event not ongoing' });
      return;
    }

    socket.join(eventId);
    socket.emit('success', { code: 200, message: 'Successfully joined event' });
  } catch (err) {
    console.log(err);
    socket.emit('exception', { code: 500, message: 'Internal Server Error' });
  }
}

export function leaveEvent(userId, eventId, socket, io) {
  socket.leave(eventId);
  console.log(`User ${userId} just left the event ${eventId}`);
}
