import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from './helpers/validation';
import User from '../../models/userModel';

function checkIfForbidden(isPrivate, event, userId, guestId) {
  if (isPrivate) {
    if (event[0].CreatorId !== userId) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }
  } else if (userId !== guestId) {
    throw new ErrorResponseHandler(403, 'Forbidden');
  }
}

export default async function inviteGuestToEvent(req, res, next) {
  const { userId } = req.decoded;
  const { eventId, guestId } = req.body;

  try {
    checkUnknownFields(['eventId', 'guestId'], req.body);

    validateType('eventId', eventId, 'number');
    validateType('guestId', guestId, 'number');

    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event with this ID');
    }

    const isPrivate = event[0].IsPrivate;

    checkIfForbidden(isPrivate, event, userId, guestId);

    const guest = await User.getUserProfile(['id'], guestId);
    if (guest[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No user with this ID');
    }

    const status = isPrivate ? 'Invited' : 'Going';
    await Event.addGuest(eventId, guestId, false, status);

    res.status(200).send({
      statusCode: 200,
      message: `User ${guestId} invited to event ${eventId}`,
    });
  } catch (err) {
    next(err);
  }
}
