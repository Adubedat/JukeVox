import express from 'express';
import createEvent from '../../controller/event/createEvent';
import updateEvent from '../../controller/event/updateEvent';

const router = express.Router();

router.route('/')
  .post(createEvent);

router.patch('/:eventId', updateEvent);

export default router;
