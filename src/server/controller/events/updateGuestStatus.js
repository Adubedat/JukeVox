import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from './helpers/validation';

export default async function updateEvent(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;
  const { guestStatus } = req.body;

  try {
    checkUnknownFields('guestStatus', req.body);
    validateType('guestStatus', guestStatus, 'string');

    if (guestStatus !== 'Going' && guestStatus !== 'NotGoing') {
      throw new ErrorResponseHandler(400, 'Status must be either Going or NotGoing');
    }

    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event found with this ID');
    }

    const oldGuestStatus = await Event.getGuestStatusForEvent(userId, eventId);
    if (oldGuestStatus[0] === undefined) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    const update = await Event.updateGuestStatus(userId, eventId, guestStatus);

    if (update.affectedRows > 0) {
      res.send({
        message: 'GuestStatus successfully updated!',
        statusCode: 200,
      });
    } else {
      throw new ErrorResponseHandler(500, 'Unexpected error occured');
    }
  } catch (err) {
    next(err);
  }
}
