import express from 'express';
import { deleteUser } from '../../controller/userController';

const router = express.Router();

router.route('/me')
  .delete(deleteUser);

export default router;
