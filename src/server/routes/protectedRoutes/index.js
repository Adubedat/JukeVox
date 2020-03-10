import express from 'express';
import eventRoutes from './eventsRoutes';
import usersRoutes from './usersRoutes';
import friendshipsRoutes from './friendshipsRoutes';
import inviteRoutes from './inviteRoutes';
import tracksRoutes from './tracksRoutes';

import verifyJwt from '../../middlewares/verifyJwt';
import votesRoutes from './votesRoutes';

const router = express.Router();

router.use(verifyJwt);
router.use('/', usersRoutes);
router.use('/', eventRoutes);
router.use('/', inviteRoutes);
router.use('/', friendshipsRoutes);
router.use('/', tracksRoutes);

router.use('/votes', votesRoutes);

export default router;
