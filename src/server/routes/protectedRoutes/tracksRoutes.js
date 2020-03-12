import express from 'express';
import searchTracks from '../../controller/tracks/searchTracks';
import addTrack from '../../controller/tracks/addTrack';

const router = express.Router();

router.route('/tracks')
  .get(searchTracks);

router.route('/events/:eventId/tracks')
  .post(addTrack);

export default router;
