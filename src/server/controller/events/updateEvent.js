import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import validateEventBody from './helpers/validation';

export default async function updateEvent(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;
  const acceptedFields = [
    'name',
    'description',
    'eventPicture',
    'startDate',
    'endDate',
    'location',
    'latitude',
    'longitude',
    'streamerDevice',
    'isPrivate',
    'restrictVotingToEventHours',
  ];
  try {
    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event found with this ID');
    }
    if (event[0].CreatorId !== userId) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    checkUnknownFields(acceptedFields, req.body);
    validateEventBody(req.body);

    await Event.updateEvent(eventId, req.body);

    const responseBody = req.body;
    responseBody.Id = eventId;

    res.send({
      message: 'Event successfully updated!',
      statusCode: 204,
      data: responseBody,
    });
  } catch (err) {
    next(err);
  }
}
