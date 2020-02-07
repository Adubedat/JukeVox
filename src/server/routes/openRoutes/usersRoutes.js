import express from 'express';
import createUser from '../../controller/users/createUser';
import searchForUser from '../../controller/users/searchForUser';
import getUserAccountsTypes from '../../controller/users/getUserAccountsTypes';


const router = express.Router();

router.route('/')
  .get(searchForUser)
  .post(createUser);

router.get('/:email/accounts', getUserAccountsTypes);

export default router;
