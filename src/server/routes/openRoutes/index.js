import express from 'express';
import userRoute from './usersRoutes';
import confirmEmail from '../../controller/users/confirmEmail';
import login from '../../controller/users/login';

const router = express.Router();

router.use((req, res, next) => {
  console.log('%s %s', req.method, req.path);
  next();
});

router.use('/users', userRoute);

router.patch('/confirmEmail/:token', confirmEmail);

router.post('/login', login);

export default router;
