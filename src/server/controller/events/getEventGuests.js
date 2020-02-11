import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';

export default async function getEventGuests(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;
  try {
    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event with this id');
    }
    if (event[0].CreatorId !== userId) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }
    const eventGuests = await Event.getEventGuests(eventId);

    if (eventGuests[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No guests found for this event');
    }

    res.status(200).send({
      statusCode: 200,
      message: 'The guests for this event',
      data: eventGuests,
    });
  } catch (err) {
    next(err);
  }
}
