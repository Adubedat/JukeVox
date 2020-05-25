import express from 'express';
import createFriendship from '../../controller/friendships/createFriendship';
import getMeFriends from '../../controller/friendships/getMeFriends';
import deleteFriendship from '../../controller/friendships/deleteFriendship';

const router = express.Router();

router.post('/me/friendships', createFriendship);

router.delete('/me/friendships/:addresseeId', deleteFriendship);

router.get('/me/friends', getMeFriends);

export default router;
