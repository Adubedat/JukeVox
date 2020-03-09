import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from '../events/helpers/validation';
import Vote from '../../models/voteModel';
import Event from '../../models/eventModel';
import { ErrorResponseHandler } from '../../../helpers/error';

export default async function voteForTrack(req, res, next) {
  const { userId } = req.decoded;
  const { eventId, trackId } = req.params;
  const trackIdAsInt = parseInt(trackId, 10);
  const { vote } = req.body;

  try {
    checkUnknownFields(['vote'], req.body);

    // TODO: Check trackId is a number
    // validateType('trackId', trackId, 'number');
    validateType('vote', vote, 'number');

    // TODO: Check that trackId exists

    const event = await Event.getEvent(eventId);
    if (event[0] == null) {
      throw new ErrorResponseHandler(404, 'No event found with this ID');
    }

    // TODO: Check if the user is going to the event

    // TODO: Check if the track is in the event

    // TODO: Check if vote is === to 1, -1 or 0

    await Vote.addVote(trackIdAsInt, userId, vote);

    res.status(200).send({
      statusCode: 200,
      message: `Vote ${vote} for track ${trackId} successfully added`,
    });
  } catch (err) {
    next(err);
  }
}
