import express from 'express';
import updateUserProfile from '../../controller/users/updateUserProfile';
import deleteUser from '../../controller/users/deleteUser';
import getMe from '../../controller/users/getMe';
import updatePassword from '../../controller/users/updatePassword';
import linkFacebook from '../../controller/users/linkFacebook';
import linkGoogle from '../../controller/users/linkGoogle';

const router = express.Router();

router.route('/me')
  .get(getMe)
  .delete(deleteUser)
  .patch(updateUserProfile);

router.patch('/me/password', updatePassword);

router.post('/me/linkGoogle', linkGoogle);

router.post('/me/linkFacebook', linkFacebook);

export default router;
