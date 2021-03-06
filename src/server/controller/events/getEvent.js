import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import Tracks from '../../models/tracksModel';

export default async function getEvent(req, res, next) {
  const { eventId } = req.params;
  const { userId } = req.decoded;

  try {
    const event = await Event.getEvent(eventId);

    if (event[0] === undefined) {
      throw new ErrorResponseHandler(404, 'No event found with this ID');
    }

    if (event[0].IsPrivate) {
      const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
      if (guestStatusResponse[0] == null) {
        throw new ErrorResponseHandler(403, 'Forbidden');
      }
    }

    const tracks = await Tracks.getTracksForEvent(eventId, userId);

    const trackHistory = await Tracks.getTrackHistoryForEvent(eventId);

    const currentTrack = await Tracks.getCurrentTrackForEvent(eventId);

    event[0].Tracks = tracks;
    event[0].CurrentTrack = currentTrack;
    event[0].TrackHistory = trackHistory;

    res.status(200).send({
      statusCode: 200,
      message: `Event with Id: ${eventId}`,
      data: event[0],
    });
  } catch (err) {
    next(err);
  }
}
