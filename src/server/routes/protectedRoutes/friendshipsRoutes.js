import express from 'express';
import createFriendship from '../../controller/friendships/createFriendship';
import getMeFriends from '../../controller/friendships/getMeFriends';
import deleteFriendship from '../../controller/friendships/deleteFriendship';

const router = express.Router();

// TODO: Refactor into meRoutes (?)
router.route('/me/friendships')
  .post(createFriendship)
  .delete(deleteFriendship);

router.get('/me/friends', getMeFriends);

export default router;
