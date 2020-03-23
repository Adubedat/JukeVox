import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';

export default async function getPlayerControl(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;

  try {
    checkUnknownFields(['eventId'], req.params);

    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event with this ID');
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    const controllers = await Event.getPlayerControl(eventId);

    res.send({
      statusCode: 200,
      message: 'List of users with player control',
      data: controllers,
    });
  } catch (err) {
    next(err);
  }
}
