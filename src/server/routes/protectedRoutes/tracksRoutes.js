import express from 'express';
import searchTracks from '../../controller/tracks/searchTracks';
import addTrack from '../../controller/tracks/addTrack';
import deleteTrack from '../../controller/tracks/deleteTrack';
import getNextTrack from '../../controller/tracks/getNextTrack';

const router = express.Router();

router.route('/tracks')
  .get(searchTracks);

router.route('/events/:eventId/tracks')
  .post(addTrack);

router.route('/events/:eventId/tracks/:trackId')
  .delete(deleteTrack);

router.route('/events/:eventId/tracks/nextTrack')
  .get(getNextTrack);

export default router;
