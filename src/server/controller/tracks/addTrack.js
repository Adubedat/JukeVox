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
  if (typeof body.title !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError title: expected string but received ${typeof body.title}`);
  }
  if (typeof body.duration !== 'number') {
    throw new ErrorResponseHandler(400, `TypeError duration: expected number but received ${typeof body.duration}`);
  }
  if (typeof body.artistName !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError artistName: expected string but received ${typeof body.artistName}`);
  }
  if (typeof body.pictureSmall !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError pictureSmall: expected string but received ${typeof body.pictureSmall}`);
  }
  if (typeof body.pictureBig !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError pictureBig: expected string but received ${typeof body.pictureBig}`);
  }
}

async function verifyTrackInfo(body) {
  const url = `https://api.deezer.com/track/${body.deezerSongId}`;

  const response = await axios.get(url);
  if (response.data.error !== undefined) {
    throw new ErrorResponseHandler(400, 'Invalid deezerSongId');
  }
  if (response.data.title !== body.title) {
    throw new ErrorResponseHandler(400, 'The given title does not correspond to the deezer title');
  }
  if (response.data.duration !== body.duration) {
    throw new ErrorResponseHandler(400, 'The given duration does not correspond to the deezer duration');
  }
  if (response.data.artist.name !== body.artistName) {
    throw new ErrorResponseHandler(400, 'The given artistName does not correspond to the deezer artistName');
  }
}

function formatData(trackId, userId, eventId, body) {
  return ({
    id: trackId,
    eventId,
    userId,
    deezerSongId: body.deezerSongId,
    title: body.title,
    duration: body.duration,
    artistName: body.artistName,
    pictureSmall: body.pictureSmall,
    pictureBig: body.pictureBig,
  });
}

export default async function addTrack(req, res, next) {
  const { userId } = req.decoded;
  const { eventId } = req.params;

  try {
    checkUnknownFields(['eventId'], req.params);
    checkUnknownFields(['deezerSongId', 'title', 'duration', 'artistName', 'pictureSmall', 'pictureBig'], req.body);
    await validateBody(userId, eventId, req.body);
    await verifyTrackInfo(req.body);

    const postTrack = await Tracks.addTrack(userId, eventId, req.body);
    const data = formatData(postTrack.insertId, userId, eventId, req.body);
    res.status(201).send({
      message: 'Track successfully added to the event',
      statusCode: 201,
      data,
    });
  } catch (err) {
    next(err);
  }
}
