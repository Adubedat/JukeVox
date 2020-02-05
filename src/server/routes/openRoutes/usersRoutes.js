import express from 'express';
import {
  createUser, getUserAccountsTypes, searchForUser,
} from '../../controller/userController';

const router = express.Router();

router.route('/')
  .get(searchForUser)
  .post(createUser);

router.get('/:email/accounts', getUserAccountsTypes);

export default router;
