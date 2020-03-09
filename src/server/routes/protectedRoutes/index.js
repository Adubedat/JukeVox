import express from 'express';
import eventRoutes from './eventsRoutes';
import usersRoutes from './usersRoutes';
import friendshipsRoutes from './friendshipsRoutes';
import inviteRoutes from './inviteRoutes';
import verifyJwt from '../../middlewares/verifyJwt';

const router = express.Router();

router.use(verifyJwt);
router.use('/', usersRoutes);
router.use('/', eventRoutes);
router.use('/', inviteRoutes);
router.use('/', friendshipsRoutes);

export default router;
