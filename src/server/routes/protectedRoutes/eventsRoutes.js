import express from 'express';
import createEvent from '../../controller/events/createEvent';
import updateEvent from '../../controller/events/updateEvent';
import getEvent from '../../controller/events/getEvent';
import getEventGuests from '../../controller/events/getEventGuests';
import getEventsByUser from '../../controller/events/getEventsByUser';


const router = express.Router();

router.route('/events')
  .post(createEvent);

router.get('/me/events', getEventsByUser);

router.route('/events/:eventId')
  .get(getEvent)
  .patch(updateEvent);

router.get('/events/:eventId/guests', getEventGuests);

export default router;
