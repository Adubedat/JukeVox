import express from 'express';
import inviteGuestToEvent from '../../controller/events/inviteGuestToEvent';

const router = express.Router();

router.route('/')
  .post(inviteGuestToEvent);

export default router;
