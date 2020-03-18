import axios from 'axios';
import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';

function validateBody(query) {
  if (typeof query !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError query: expected string but received ${typeof query}`);
  }
}

function formatTracks(tracks) {
  return tracks.map((track) => ({
    deezerSongId: track.id,
    title: track.title,
    duration: track.duration,
    artistName: track.artist.name,
    pictureSmall: track.album.cover_small,
    pictureBig: track.album.cover_big,
  }));
}

export default async function searchTracks(req, res, next) {
  const { query } = req.query;
  const url = 'https://api.deezer.com/search/track';

  try {
    checkUnknownFields(['query'], req.query);
    validateBody(query);

    const response = await axios.get(url, { params: { q: query } });
    const { error } = response.data;
    if (error) {
      throw new ErrorResponseHandler(error.code, error.message);
    }
    const tracks = formatTracks(response.data.data);
    res.send({
      message: 'Tracks found',
      statusCode: 200,
      data: tracks,
    });
  } catch (err) {
    next(err);
  }
}
