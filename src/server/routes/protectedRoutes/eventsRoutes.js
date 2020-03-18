import express from 'express';
import createEvent from '../../controller/events/createEvent';
import updateEvent from '../../controller/events/updateEvent';
import getEvent from '../../controller/events/getEvent';
import getEventGuests from '../../controller/events/getEventGuests';
import getEventsByUser from '../../controller/events/getEventsByUser';
import voteForTrack from '../../controller/votes/voteForTrack';
import updateGuestStatus from '../../controller/events/updateGuestStatus';

const router = express.Router();

router.route('/events')
  .post(createEvent);

router.get('/me/events', getEventsByUser);

router.patch('/me/events/:eventId/guestStatus', updateGuestStatus);

router.route('/events/:eventId')
  .get(getEvent)
  .patch(updateEvent);

router.get('/events/:eventId/guests', getEventGuests);

router.post('/events/:eventId/tracks/:trackId/vote', voteForTrack);

export default router;
