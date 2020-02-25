import axios from 'axios';
import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';

function validateBody(query) {
  if (typeof query !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError query: expected number but received ${typeof query}`);
  }
}

export default async function searchTracks(req, res, next) {
  const { query } = req.query;
  const url = 'https://api.deezer.com/search/track';

  try {
    checkUnknownFields(['query'], req.query);
    validateBody(query);

    const response = await axios.get(url, { params: { q: query } });
    const tracks = response.data;
    console.log(tracks);
    res.send({
      message: 'Tracks found',
      data: tracks.data,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
