import express from 'express';
import voteForTrack from '../../controller/votes/voteForTrack';

const router = express.Router();

router.route('/:trackId')
  .post(voteForTrack);

export default router;
