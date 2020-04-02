import moment from 'moment';
import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from '../events/helpers/validation';
import Vote from '../../models/voteModel';
import Event from '../../models/eventModel';
import { ErrorResponseHandler } from '../../../helpers/error';
import DATETIME_FORMAT from '../../constants';
import Tracks from '../../models/tracksModel';


export default async function voteForTrack(req, res, next) {
  const { userId } = req.decoded;
  const { eventId, trackId } = req.params;
  const { vote } = req.body;

  try {
    checkUnknownFields(['vote'], req.body);

    validateType('vote', vote, 'number');

    const trackIdAsInt = parseInt(trackId, 10);

    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'Event not found');
    }

    const track = await Tracks.getTrack(trackIdAsInt);
    if (track[0] === undefined || track[0].EventId.toString() !== eventId) {
      throw new ErrorResponseHandler(404, 'Track not found');
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    if (event[0].RestrictVotingToEventHours === 1) {
      const timeNow = moment().format(DATETIME_FORMAT);
      if (moment(timeNow).isBefore(event[0].StartDate) || moment(timeNow).isAfter(event[0].EndDate)) {
        throw new ErrorResponseHandler(403, 'Forbidden. Event is not ongoing');
      }
    }

    await Vote.addVote(trackIdAsInt, userId, vote);


    const votesSum = await Vote.getVotesSumForTrack(trackIdAsInt);

    req.io.to(eventId).emit('new_vote', { data: { userId, eventId, voteInfo: votesSum[0] } });

    res.status(200).send({
      statusCode: 200,
      message: `Vote ${vote} for track ${trackId} successfully added`,
    });
  } catch (err) {
    next(err);
  }
}
