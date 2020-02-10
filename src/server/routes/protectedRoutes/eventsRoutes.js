import express from 'express';
import createEvent from '../../controller/event/createEvent';
import updateEvent from '../../controller/event/updateEvent';
import getEvent from '../../controller/event/getEvent';

const router = express.Router();

router.route('/')
  .post(createEvent);

router.route('/:eventId')
  .get(getEvent)
  .patch(updateEvent);

export default router;
