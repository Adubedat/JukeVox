import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';

// TODO: Instead of returning a list of event IDs, return a list of
// actual events. This will reduce the number of api calls required

export default async function getEvent(req, res, next) {
  const { userId } = req.decoded;
  try {
    const events = await Event.getEventsByUser(userId);

    if (events[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No events found for this user');
    }

    res.status(200).send({
      statusCode: 200,
      message: `The events for the user ${userId}`,
      data: events,
    });
  } catch (err) {
    next(err);
  }
}
