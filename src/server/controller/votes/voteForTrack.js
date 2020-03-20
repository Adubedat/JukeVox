import moment from 'moment';
import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from '../events/helpers/validation';
import Vote from '../../models/voteModel';
import Event from '../../models/eventModel';
import { ErrorResponseHandler } from '../../../helpers/error';
import DATETIME_FORMAT from '../../constants';


export default async function voteForTrack(req, res, next) {
  const { userId } = req.decoded;
  const { eventId, trackId } = req.params;
  const trackIdAsInt = parseInt(trackId, 10);
  const { vote } = req.body;

  try {
    checkUnknownFields(['vote'], req.body);

    validateType('vote', vote, 'number');

    // TODO: Check that trackId exists

    const event = await Event.getEvent(eventId);
    if (event[0] == null) {
      throw new ErrorResponseHandler(404, 'Event not found');
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    const timeNow = moment().format(DATETIME_FORMAT);
    if (moment(timeNow).isBefore(event[0].StartDate) || moment(timeNow).isAfter(event[0].EndDate)) {
      throw new ErrorResponseHandler(403, 'Forbidden. Event is not ongoing');
    }

    // TODO: Check if the track is in the event'

    await Vote.addVote(trackIdAsInt, userId, vote);


    const votesSum = await Vote.getVotesSumForTrack(trackIdAsInt);

    req.io.to(eventId).emit('new_vote', { data: votesSum });

    res.status(200).send({
      statusCode: 200,
      message: `Vote ${vote} for track ${trackId} successfully added`,
    });
  } catch (err) {
    next(err);
  }
}
