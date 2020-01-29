import express from 'express';
import usersRoutes from './usersRoutes';

const router = express.Router();

router.use((req, res, next) => {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();
});

router.use('/users', usersRoutes);

export default router;
