import express from 'express';
import {
  createUser, deleteUser, getUserAccountsTypes, searchForUser, confirmUserEmail, loginUser,
} from '../controller/userController';

const router = express.Router();

router.use((req, res, next) => {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();
});

router.route('/users')
  .post(createUser);

router.route('/users/me')
  .delete(deleteUser);

router.route('/users/:email/accounts')
  .get(getUserAccountsTypes);

router.route('/users/search')
  .get(searchForUser);

router.route('/users/verify/:token')
  .get(confirmUserEmail);

router.route('/users/login')
  .post(loginUser);

export default router;
