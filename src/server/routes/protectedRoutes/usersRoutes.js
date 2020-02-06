import express from 'express';
import { deleteUser, getMe, updatePassword } from '../../controller/userController';
import updateUserProfile from '../../controller/users/updateUserProfile';

const router = express.Router();

router.route('/me')
  .get(getMe)
  .delete(deleteUser)
  .patch(updateUserProfile);

router.patch('/me/password', updatePassword);

export default router;
