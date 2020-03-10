import { checkUnknownFields } from '../../../helpers/validation';
import { validateType } from '../events/helpers/validation';
import Vote from '../../models/voteModel';

export default async function voteForTrack(req, res, next) {
  const { userId } = req.decoded;
  const { trackId } = req.params;
  const trackIdAsInt = parseInt(trackId, 10);
  const { vote } = req.body;

  try {
    checkUnknownFields(['vote'], req.body);

    // TODO: Check trackId is a number
    // validateType('trackId', trackId, 'number');
    validateType('vote', vote, 'number');

    // TODO: Check that trackId exists

    // TODO: Check if user is 'going' to the event

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
