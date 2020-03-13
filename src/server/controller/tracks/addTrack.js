import axios from 'axios';
import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import Tracks from '../../models/tracksModel';

async function validateBody(userId, eventId, body) {
  if (typeof eventId !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError eventId: expected string but received ${typeof eventId}`);
  }
  const [event] = await Event.getEventByUserAndEventId(userId, eventId);
  if (event === undefined) {
    throw new ErrorResponseHandler(403, 'Forbidden : Event does not exist or you are not part of it');
  }
  if (typeof body.deezerSongId !== 'number') {
    throw new ErrorResponseHandler(400, `TypeError deezerSongId: expected number but received ${typeof body.deezerSongId}`);
  }
}

function formatData(trackId, userId, eventId, track) {
  return ({
    id: trackId,
    eventId,
    userId,
    deezerSongId: track.id,
    title: track.title,
    duration: track.duration,
    artistName: track.artist.name,
    pictureSmall: track.album.cover_small,
    pictureBig: track.album.cover_big,
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

    const postTrack = await Tracks.addTrack(userId, eventId, track.data);
    const data = formatData(postTrack.insertId, userId, eventId, track.data);
    res.status(201).send({
      message: 'Track successfully added to the event',
      statusCode: 201,
      data,
    });
  } catch (err) {
    next(err);
  }
}
