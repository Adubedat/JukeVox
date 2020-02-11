import express from 'express';
import createFriendship from '../../controller/friendships/createFriendship';


const router = express.Router();

router.route('/me/friendships')
  .post(createFriendship);

export default router;
