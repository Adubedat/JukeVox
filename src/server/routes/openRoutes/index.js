import express from 'express';
import userRoute from './usersRoutes';
import { confirmEmail, login } from '../../controller/userController';

const router = express.Router();

router.use((req, res, next) => {
  console.log('%s %s', req.method, req.path);
  next();
});

router.use('/users', userRoute);

router.put('/confirmEmail/:token', confirmEmail);

router.post('/login', login);

export default router;
