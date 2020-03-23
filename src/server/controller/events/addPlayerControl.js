import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from './helpers/validation';

export default async function addPlayerControl(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;
  const { guestId } = req.body;

  try {
    checkUnknownFields(['guestId'], req.body);
    checkUnknownFields(['eventId'], req.params);

    validateType('guestId', guestId, 'number');

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

    await Event.changePlayerControl(eventId, guestId, true);

    res.status(200).send({
      statusCode: 200,
      message: `User ${guestId} can now control the player`,
    });
  } catch (err) {
    next(err);
  }
}
