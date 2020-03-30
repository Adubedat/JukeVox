import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';

export default async function deleteEventGuest(req, res, next) {
  const { userId } = req.decoded;
  const { eventId, guestId } = req.params;

  try {
    checkUnknownFields(['eventId', 'guestId'], req.params);

    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'Event not found');
    }

    if (userId !== event[0].CreatorId) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    const guest = await Event.getGuestStatusForEvent(guestId, eventId);
    if (guest[0] === undefined) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    const response = await Event.deleteEventGuest(eventId, guestId);
    if (response.affectedRows !== 1) {
      throw new ErrorResponseHandler(500, 'Internal server error');
    }

    res.status(200).send({
      message: 'Guest deleted successfully',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
