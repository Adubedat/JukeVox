import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import Tracks from '../../models/tracksModel';

export default async function getNextTrack(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;

  try {
    checkUnknownFields(['eventId'], req.params);

    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event with this ID');
    }

    if (event[0].CreatorId !== userId) {
      throw new ErrorResponseHandler(403, 'Forbidden');
    }

    const nextTrack = await Tracks.getNextTrackToPlay(eventId);
    if (nextTrack[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No tracks left to play');
    }

    await Tracks.addTrackToHistory(nextTrack[0].Id, eventId);

    req.io.to(eventId).emit('next_track', { data: { eventId, track: nextTrack[0] } });

    res.status(200).send({
      statusCode: 200,
      message: 'Successfully got the next track',
      data: nextTrack,
    });
  } catch (err) {
    next(err);
  }
}
