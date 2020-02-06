import express from 'express';
import usersRoutes from './usersRoutes';
import eventRoutes from './eventsRoutes';
import verifyJwt from '../../middlewares/verifyJwt';

const router = express.Router();

router.use(verifyJwt);
router.use('/users', usersRoutes);
router.use('/events', eventRoutes);

export default router;
