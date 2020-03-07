import express from 'express';
import eventRoutes from './eventsRoutes';
import meRoutes from './meRoutes';
import friendshipsRoutes from './friendshipsRoutes';
import inviteRoutes from './inviteRoutes';
import verifyJwt from '../../middlewares/verifyJwt';
import votesRoutes from './votesRoutes';

const router = express.Router();

router.use(verifyJwt);
router.use('/me', meRoutes);
router.use('/events', eventRoutes);
router.use('/invite', inviteRoutes);
router.use('/votes', votesRoutes);
router.use('/', friendshipsRoutes);

export default router;
