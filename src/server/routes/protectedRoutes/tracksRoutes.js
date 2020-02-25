import express from 'express';
import searchTracks from '../../controller/tracks/searchTracks';

const router = express.Router();

router.route('/tracks')
  .get(searchTracks);

export default router;
