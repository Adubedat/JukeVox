import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from './helpers/validation';

export default async function getEvent(req, res, next) {
  const { userId } = req.decoded;
  try {
    const possibleFilters = ['Going', 'NotGoing', 'Invited'];
    checkUnknownFields(possibleFilters, req.query);

    Object.entries(req.query).forEach((entry) => {
      validateType(entry[0], entry[1], 'boolean');
    });
    const wantedFilters = possibleFilters.filter((field) => req.query[field] === 'true');

    const events = await Event.getEventsByUser(userId, wantedFilters);

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
