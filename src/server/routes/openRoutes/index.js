import express from 'express';
import userRoute from './usersRoutes';
import confirmEmail from '../../controller/users/confirmEmail';
import login from '../../controller/users/login';
import facebookLogin from '../../controller/users/facebookLogin';
import googleLogin from '../../controller/users/googleLogin';
import forgotPassword from '../../controller/users/forgotPassword';
import getResetPasswordForm from '../../controller/users/getResetPasswordForm';
import resetPassword from '../../controller/users/resetPassword';
import confirmLoaderio from '../../controller/loaderio/confirmLoaderio';
import { openRoutesRateLimiter } from '../../middlewares/rateLimiters';
import logger from '../../../helpers/logger';

const router = express.Router();

router.use((req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  const IP = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
  logger.info('%s %s', req.method, req.path, { userAgent: req.get('user-agent'), IP });
  next();
});

router.use(openRoutesRateLimiter);

router.get('/loaderio-93f4e56e9270cfa4d6e5d226b66a9405', confirmLoaderio);

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
