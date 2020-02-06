import express from 'express';
import { deleteUser, getMe, updatePassword } from '../../controller/userController';

const router = express.Router();

router.route('/me')
  .get(getMe)
  .delete(deleteUser);

router.put('/me/password', updatePassword);

export default router;
