import express from 'express';
import eventRoutes from './eventsRoutes';
import meRoutes from './meRoutes';
import friendshipsRoutes from './friendshipsRoutes';
import verifyJwt from '../../middlewares/verifyJwt';

const router = express.Router();

router.use(verifyJwt);
router.use('/me', meRoutes);
router.use('/events', eventRoutes);
router.use('/', friendshipsRoutes);

export default router;
