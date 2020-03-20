import express from 'express';
import userRoute from './usersRoutes';
import confirmEmail from '../../controller/users/confirmEmail';
import login from '../../controller/users/login';
import facebookLogin from '../../controller/users/facebookLogin';
import googleLogin from '../../controller/users/googleLogin';
import forgotPassword from '../../controller/users/forgotPassword';
import getResetPasswordForm from '../../controller/users/getResetPasswordForm';
import resetPassword from '../../controller/users/resetPassword';

const router = express.Router();

router.use((req, res, next) => {
  console.log('%s %s', req.method, req.path);
  next();
});

router.use('/users', userRoute);

router.get('/confirmEmail/:token', confirmEmail);

router.post('/login', login);

router.post('/facebookLogin', facebookLogin);

router.post('/googleLogin', googleLogin);

router.post('/forgotPassword', forgotPassword);

router.route('/resetPassword/:token')
  .get(getResetPasswordForm)
  .post(resetPassword);

export default router;
