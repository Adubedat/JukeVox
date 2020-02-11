import express from 'express';
import createFriendship from '../../controller/friendships/createFriendship';
import getMeFriends from '../../controller/friendships/getMeFriends';


const router = express.Router();

router.route('/me/friendships')
  .post(createFriendship);

router.get('/me/friends', getMeFriends);

export default router;
