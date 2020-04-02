import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import validateBody from './helpers/validation';

export default async function createEvent(req, res, next) {
  const { userId } = req.decoded;
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
    checkUnknownFields(acceptedFields, req.body);

    validateBody(req.body);

    const eventConfirmation = await Event.createNewEvent(userId, req.body);

    await Event.addGuest(eventConfirmation.insertId, userId, true, 'Going');

    req.body.Id = eventConfirmation.insertId;

    res.status(200).send({
      statusCode: 200,
      message: 'Event successfully created!',
      data: req.body,
    });
  } catch (err) {
    next(err);
  }
}
