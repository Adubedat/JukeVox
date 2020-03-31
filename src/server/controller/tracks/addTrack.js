import axios from 'axios';
import moment from 'moment';
import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import Tracks from '../../models/tracksModel';
import DATETIME_FORMAT from '../../constants';

async function validateBody(userId, eventId, body) {
  const [event] = await Event.getGuestStatusForEvent(userId, eventId);
  if (event === undefined) {
    throw new ErrorResponseHandler(403, 'Forbidden : Event does not exist or you are not part of it');
  }
  if (event.GuestStatus !== 'Going') {
    throw new ErrorResponseHandler(403, 'Forbidden : You must be going to the event to add a song');
  }
  if (typeof body.deezerSongId !== 'number') {
    throw new ErrorResponseHandler(400, `TypeError deezerSongId: expected number but received ${typeof body.deezerSongId}`);
  }
}

function formatData(trackId, userId, eventId, track, addedAt) {
  return ({
    Id: trackId,
    EventId: eventId,
    UserId: userId,
    DeezerSongId: track.id,
    Title: track.title,
    Duration: track.duration,
    ArtistName: track.artist.name,
    PictureSmall: track.album.cover_small,
    PictureBig: track.album.cover_big,
    AddedAt: addedAt,
  });
}

export default async function addTrack(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;
  const { deezerSongId } = req.body;
  const url = `https://api.deezer.com/track/${deezerSongId}`;

  try {
    checkUnknownFields(['eventId'], req.params);
    checkUnknownFields(['deezerSongId'], req.body);
    await validateBody(userId, eventId, req.body);
    const track = await axios.get(url);

    if (track.data.error !== undefined) {
      throw new ErrorResponseHandler(400, 'Invalid deezerSongId');
    }
    const addedAt = moment().format(DATETIME_FORMAT);

    const postTrack = await Tracks.addTrack(userId, eventId, track.data, addedAt);
    const data = formatData(postTrack.insertId, userId, eventId, track.data, addedAt);

    req.io.to(eventId).emit('new_track', { data });

    res.status(201).send({
      message: 'Track successfully added to the event',
      statusCode: 201,
      data,
    });
  } catch (err) {
    next(err);
  }
}
