import express from 'express';
import eventRoutes from './eventsRoutes';
import usersRoutes from './usersRoutes';
import friendshipsRoutes from './friendshipsRoutes';
import inviteRoutes from './inviteRoutes';
import tracksRoutes from './tracksRoutes';

import verifyJwt from '../../middlewares/verifyJwt';
import { loggedInRateLimiter } from '../../middlewares/rateLimiters';

const router = express.Router();

router.use(verifyJwt);
router.use(loggedInRateLimiter);
router.use('/', usersRoutes);
router.use('/', eventRoutes);
router.use('/', inviteRoutes);
router.use('/', friendshipsRoutes);
router.use('/', tracksRoutes);

export default router;
