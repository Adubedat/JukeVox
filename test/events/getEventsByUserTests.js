/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';
import Database from '../../src/helpers/database';

import { generateJwt } from '../../src/helpers/utils';

const sql = new Database();
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

  async function populateTables(user1, user2, user3) {
    try {
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);

      await addEventGuest(event1.insertId, user1.insertId, 'Going');
      await addEventGuest(event1.insertId, user2.insertId, 'Going');
      await addEventGuest(event1.insertId, user3.insertId, 'Invited');

      await addEventGuest(event2.insertId, user1.insertId, 'Going');
      await addEventGuest(event2.insertId, user2.insertId, 'NotGoing');

      await addEventGuest(event3.insertId, user1.insertId, 'Invited');
    } catch (err) {
      console.log(err);
    }
  }

  describe('GET /me/events', () => {
    it('should GET a list of 3 events that user is attending / invited / not going', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);


      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user1.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(3);
    });

    it('should GET a list of 2 events that user is attending / not going', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);


      const jwt = generateJwt(user2.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user2.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(2);
    });

    it('should GET a list of 1 event that user is invited', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);


      const jwt = generateJwt(user3.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user3.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
    });

    it('should not GET events with a user not invited / going / not going to any', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      const loserUser = await addUserProfile('loserUser');


      const jwt = generateJwt(loserUser.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No events found for this user');
    });
  });
});
