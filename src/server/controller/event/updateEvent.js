import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import validateBody from './helpers/validation';

export default async function updateEvent(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;
  const acceptedFields = [
    'name',
    'description',
    'eventPicture',
    'startDate',
    'endDate',
    'latitude',
    'longitude',
    'streamerDevice',
    'isPrivate',
  ];
  try {
    const event = await Event.getEvent(eventId);
    if (event === null) {
      throw new ErrorResponseHandler(404, 'No event found with this Id');
    }
    if (event.CreatorId !== userId) {
      throw new ErrorResponseHandler(403, 'You cannot modify this resource');
    }

    checkUnknownFields(acceptedFields, req.body);
    validateBody(req.body);

    await Event.updateEvent(req.body);
    res.send({
      message: 'Event updated successfully!',
      statusCode: 204,
      data: req.body,
    });
  } catch (err) {
    next(err);
  }
}
