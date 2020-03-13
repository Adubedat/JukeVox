import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';

export default async function getEvent(req, res, next) {
  const { eventId } = req.params;
  const { userId } = req.decoded;

  try {
    const event = await Event.getEvent(eventId);

    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event found with this ID');
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    // TODO: Get list of tracks associated with event to add to return
    // TODO: Get list of votes associated with tracks to add to return

    res.status(200).send({
      statusCode: 200,
      message: `Event with Id: ${eventId}`,
      data: event[0],
    });
  } catch (err) {
    next(err);
  }
}
