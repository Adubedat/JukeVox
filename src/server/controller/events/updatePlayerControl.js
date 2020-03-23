import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from './helpers/validation';

function validateBool(toTest) {
  if (typeof toTest !== 'boolean') {
    throw new ErrorResponseHandler(400, `TypeError query: expected boolean but received ${typeof toTest}`);
  }
}

export default async function changePlayerControl(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;
  const { guestId, hasPlayerControl } = req.body;

  try {
    checkUnknownFields(['guestId', 'hasPlayerControl'], req.body);
    checkUnknownFields(['eventId'], req.params);

    validateType('guestId', guestId, 'number');
    validateBool(hasPlayerControl);

    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event with this ID');
    }

    if (event[0].CreatorId !== userId) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(guestId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      throw new ErrorResponseHandler(404, 'User not attending event');
    }

    const update = await Event.changePlayerControl(eventId, guestId, hasPlayerControl);

    if (update.affectedRows !== 1) {
      throw new ErrorResponseHandler(500, 'Unexpected error occured');
    }
    res.status(200).send({
      statusCode: 200,
      message: `Player control for user ${guestId} has been updated`,
    });
  } catch (err) {
    next(err);
  }
}
