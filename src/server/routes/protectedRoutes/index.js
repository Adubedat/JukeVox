import express from 'express';
import usersRoutes from './usersRoutes';
import friendshipsRoutes from './friendshipsRoutes';
import verifyJwt from '../../middlewares/verifyJwt';

const router = express.Router();

router.use(verifyJwt);
router.use('/', friendshipsRoutes);
router.use('/users', usersRoutes);

export default router;
