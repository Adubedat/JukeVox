import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';

export default async function getPublicEvents(req, res, next) {
  try {
    const { userId } = req.decoded;
    console.log(userId);
    const events = await Event.getPublicEvents();
    if (events[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No public events found');
    }

    res.status(200).send({
      statusCode: 200,
      message: 'The public events are: ',
      data: events,
    });
  } catch (err) {
    next(err);
  }
}
