import express from 'express';
import updateUserProfile from '../../controller/users/updateUserProfile';
import deleteUser from '../../controller/users/deleteUser';
import getMe from '../../controller/users/getMe';
import updatePassword from '../../controller/users/updatePassword';
import getEventsByUser from '../../controller/events/getEventsByUser';

const router = express.Router();

router.route('/')
  .get(getMe)
  .delete(deleteUser)
  .patch(updateUserProfile);

router.patch('/password', updatePassword);

router.get('/events', getEventsByUser);

export default router;
