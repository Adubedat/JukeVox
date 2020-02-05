import express from 'express';
import { deleteUser, getMe } from '../../controller/userController';

const router = express.Router();

router.route('/me')
  .get(getMe)
  .delete(deleteUser);

export default router;
