/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';
import sql from '../../src/helpers/database';
import logger from '../../src/helpers/logger';

import { generateJwt } from '../../src/helpers/utils';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();

chai.use(chaiHttp);

describe('Events', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });


  async function addUserProfile(userNumber) {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [[`Daniel${userNumber}`, `${userNumber}daniel@mail.com`, moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => logger.error(err));
    return userProfile;
  }


  async function addEventGuest(eventId, guestId, guestStatus, hasPlayerControl) {
    const eventGuestQuery = 'insert into EventGuests (EventId, GuestId, HasPlayerControl, GuestStatus) VALUES ?';
    const eventGuestValues = [[eventId, guestId, hasPlayerControl, guestStatus]];
    const eventGuest = await sql.query(eventGuestQuery, [eventGuestValues])
      .catch((err) => logger.error(err));
    return eventGuest;
  }

  async function addEvent(nameId, creatorId) {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    const content = {
      name: `House warming #${nameId}`,
      description: 'All come over on wednesday for our housewarming!',
      startDate,
      endDate,
      location: '46 tests street',
      latitude: 48.8915482,
      longitude: 2.3170656,
      streamerDevice: 'abcd',
      isPrivate: true,
      eventPicture: 'defaultPicture1',
    };

    const eventQuery = 'INSERT INTO Events (CreatorId, Name, Description, \
        EventPicture, StartDate, EndDate, Location, Latitude, Longitude, \
        StreamerDevice, IsPrivate) VALUES ?;';
    const eventValues = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.location, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate]];
    const event = await sql.query(eventQuery, [eventValues])
      .catch((err) => logger.error(err));
    return event;
  }

  describe('GET /api/me/events/:eventId/playerControllers', () => {
    it('should get the player controllers of an event', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going', true);
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going', false);
      const eventGuest3 = await addEventGuest(event.insertId, user3.insertId, 'Going', true);

      const jwt = generateJwt(host.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/playerControllers`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('List of users with player control');
      res.body.should.have.property('data');
      res.body.data.should.have.length(2);
      res.body.data[0].GuestId.should.eql(host.insertId);
      res.body.data[1].GuestId.should.eql(user3.insertId);
    });

    it('should get the player controllers of an event (only going)', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going', true);
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going', false);
      const eventGuest3 = await addEventGuest(event.insertId, user3.insertId, 'Invited', true);

      const jwt = generateJwt(host.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/playerControllers`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('List of users with player control');
      res.body.should.have.property('data');
      res.body.data.should.have.length(1);
      res.body.data[0].GuestId.should.eql(host.insertId);
    });

    it('should not get the player controllers of an event if the event is unknown', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going', true);
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going', false);
      const eventGuest3 = await addEventGuest(event.insertId, user3.insertId, 'Going', true);

      const jwt = generateJwt(host.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId + 1}/playerControllers`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No event with this ID');
    });

    it('should not get the player controllers of an event if the user is not going', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Invited', true);
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going', false);
      const eventGuest3 = await addEventGuest(event.insertId, user3.insertId, 'Going', true);

      const jwt = generateJwt(host.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/playerControllers`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');
    });

    it('should not get the player controllers of an event if the user is not on the event list', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event = await addEvent(1, host.insertId);
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going', false);
      const eventGuest3 = await addEventGuest(event.insertId, user3.insertId, 'Going', true);

      const jwt = generateJwt(host.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/playerControllers`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');
    });

    it('should not get the player controllers of an event if the jwt is invalid', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going', true);
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going', false);
      const eventGuest3 = await addEventGuest(event.insertId, user3.insertId, 'Going', true);

      const jwt = generateJwt(host.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/playerControllers`)
        .set({ Authorization: `Bearer ${jwt}a` });

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');
    });
  });
});
