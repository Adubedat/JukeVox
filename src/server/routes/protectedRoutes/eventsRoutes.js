import express from 'express';
import createEvent from '../../controller/events/createEvent';
import updateEvent from '../../controller/events/updateEvent';
import getEvent from '../../controller/events/getEvent';

const router = express.Router();

router.route('/')
  .post(createEvent);

router.route('/:eventId')
  .get(getEvent)
  .patch(updateEvent);

export default router;
