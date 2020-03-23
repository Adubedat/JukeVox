import express from 'express';
import createEvent from '../../controller/events/createEvent';
import updateEvent from '../../controller/events/updateEvent';
import getEvent from '../../controller/events/getEvent';
import getEventGuests from '../../controller/events/getEventGuests';
import getEventsByUser from '../../controller/events/getEventsByUser';
import voteForTrack from '../../controller/votes/voteForTrack';
import getPublicEvents from '../../controller/events/getPublicEvents';
import updateGuestStatus from '../../controller/events/updateGuestStatus';
import addPlayerControl from '../../controller/events/addPlayerControl';

const router = express.Router();

router.route('/events')
  .post(createEvent)
  .get(getPublicEvents);

router.get('/me/events', getEventsByUser);

router.patch('/me/events/:eventId/guestStatus', updateGuestStatus);

router.route('/events/:eventId')
  .get(getEvent)
  .patch(updateEvent);

router.get('/events/:eventId/guests', getEventGuests);

router.post('/events/:eventId/tracks/:trackId/vote', voteForTrack);

router.route('/events/:eventId/playerControl')
  .post(addPlayerControl);

export default router;
