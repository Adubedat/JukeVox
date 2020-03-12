/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';
import sql from '../../src/helpers/database';

import { generateJwt } from '../../src/helpers/utils';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();

chai.use(chaiHttp);


// TODO : Write tests for JWT
describe('Vote', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM Votes;');
    await sql.query('DELETE FROM Tracks;');
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  async function addEvent(nameId, creatorId) {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    const content = {
      name: `House warming #${nameId}`,
      description: 'All come over on wednesday for our housewarming!',
      startDate,
      endDate,
      latitude: 48.8915482,
      longitude: 2.3170656,
      streamerDevice: 'abcd',
      isPrivate: true,
      eventPicture: 'defaultPicture1',
    };

    const eventQuery = 'INSERT INTO Events (CreatorId, Name, Description, \
        EventPicture, StartDate, EndDate, Latitude, Longitude, \
        StreamerDevice, IsPrivate) VALUES ?;';
    const eventValues = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate]];
    const event = await sql.query(eventQuery, [eventValues])
      .catch((err) => console.log(err));
    return event;
  }

  async function addOngoingEvent(nameId, creatorId) {
    const startDate = moment().subtract(10, 'm').format(DATETIME_FORMAT);
    const endDate = moment().add(2, 'h').format(DATETIME_FORMAT);

    const content = {
      name: `Ongoing house warming #${nameId}`,
      description: 'All come over on wednesday for our housewarming!',
      startDate,
      endDate,
      latitude: 48.8915482,
      longitude: 2.3170656,
      streamerDevice: 'abcd',
      isPrivate: true,
      eventPicture: 'defaultPicture1',
    };

    const eventQuery = 'INSERT INTO Events (CreatorId, Name, Description, \
        EventPicture, StartDate, EndDate, Latitude, Longitude, \
        StreamerDevice, IsPrivate) VALUES ?;';
    const eventValues = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate]];
    const event = await sql.query(eventQuery, [eventValues])
      .catch((err) => console.log(err));
    return event;
  }

  async function addUserProfile(userNumber) {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [[`Daniel${userNumber}`, `${userNumber}daniel@mail.com`, moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => console.log(err));
    return userProfile;
  }

  async function addEventGuest(eventId, guestId, guestStatus) {
    const eventGuestQuery = 'insert into EventGuests (EventId, GuestId, HasPlayerControl, GuestStatus) VALUES ?';
    const eventGuestValues = [[eventId, guestId, false, guestStatus]];
    const eventGuest = await sql.query(eventGuestQuery, [eventGuestValues])
      .catch((err) => console.log(err));
    return eventGuest;
  }

  async function addTrack(userId, eventId, title) {
    const addedAt = moment().format(DATETIME_FORMAT);
    const addTrackQuery = 'INSERT INTO Tracks (EventId, UserId, DeezerSongId, \
        Title, Duration, ArtistName, PictureSmall, PictureBig, AddedAt) \
      VALUES ? ';
    const addTrackValues = [[eventId, userId, 111, title, 10,
      'JukeVoxxer', 'smallUrl', 'bigUrl', addedAt]];
    const addedTrack = await sql.query(addTrackQuery, [addTrackValues])
      .catch((err) => console.log(err));
    return addedTrack;
  }

  describe('POST /api/events/:eventId/tracks/:trackId/vote', () => {
    it('should not vote for a track if the event does not exist', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      //   const event1 = await addEvent(1, user1.insertId);
      const ongoingEvent = await addOngoingEvent(1, user1.insertId);
      await addEventGuest(ongoingEvent.insertId, user1.insertId, 'Going');
      await addEventGuest(ongoingEvent.insertId, user2.insertId, 'Invited');


      const track = await addTrack(user1.insertId, ongoingEvent.insertId, 'Rythm of the night');

      const body = {
        vote: 1,
      };

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/-1/tracks/${track.insertId}/vote`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Event not found');
    });
  });
});
