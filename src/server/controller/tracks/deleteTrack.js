import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import Tracks from '../../models/tracksModel';

async function validateParams(userId, eventId, trackId) {
  if (typeof eventId !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError eventId: expected string but received ${typeof eventId}`);
  }
  if (typeof trackId !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError trackId: expected string but received ${typeof trackId}`);
  }
  const [[track], [event]] = await Promise.all([Tracks.getTrack(trackId), Event.getEvent(eventId)]);
  if (event === undefined) {
    throw new ErrorResponseHandler(404, 'Event not found');
  }
  if (track === undefined || track.EventId !== event.Id) {
    throw new ErrorResponseHandler(404, 'Track not found');
  }
  if (event.CreatorId !== userId) {
    throw new ErrorResponseHandler(403, 'Only the event\'s creator can delete tracks');
  }
}

export default async function deleteTrack(req, res, next) {
  const { userId } = req.decoded;
  const { eventId, trackId } = req.params;

  try {
    checkUnknownFields(['eventId', 'trackId'], req.params);
    await validateParams(userId, eventId, trackId);

    await Tracks.deleteTrack(trackId);
    res.status(200).send({
      message: 'Track successfully deleted',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
