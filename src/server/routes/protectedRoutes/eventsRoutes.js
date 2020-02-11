import express from 'express';
import createEvent from '../../controller/events/createEvent';
import updateEvent from '../../controller/events/updateEvent';
import getEvent from '../../controller/events/getEvent';
import getEventGuests from '../../controller/events/getEventGuests';

const router = express.Router();

router.route('/')
  .post(createEvent);

router.route('/:eventId')
  .get(getEvent)
  .patch(updateEvent);

router.get('/:eventId/guests', getEventGuests);

export default router;
