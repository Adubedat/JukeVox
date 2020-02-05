import express from 'express';
import {
  createUser, getUserAccountsTypes, searchForUser, confirmUserEmail, loginUser,
} from '../../controller/userController';

const router = express.Router();

router.route('/')
  .get(searchForUser)
  .post(createUser);

router.get('/:email/accounts', getUserAccountsTypes);

router.get('/confirmEmail/:token', confirmUserEmail);

router.post('/login', loginUser);

export default router;
