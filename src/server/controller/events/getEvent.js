import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';

export default async function getEvent(req, res, next) {
  const { eventId } = req.params;
  try {
    const event = await Event.getEvent(eventId);

    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event found with this ID');
    }

    res.status(200).send({
      statusCode: 200,
      message: `Event with Id: ${eventId}`,
      data: event[0],
    });
  } catch (err) {
    next(err);
  }
}
