import express from 'express';
import userRoute from './usersRoutes';

const router = express.Router();

router.use((req, res, next) => {
  console.log('%s %s', req.method, req.path);
  next();
});

router.use('/users', userRoute);

export default router;
