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

describe('Events', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
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
      const event4 = await addEvent(4, user2.insertId);

      await addEventGuest(event1.insertId, user1.insertId, 'Going');
      await addEventGuest(event1.insertId, user2.insertId, 'Going');
      await addEventGuest(event1.insertId, user3.insertId, 'Invited');

      await addEventGuest(event2.insertId, user1.insertId, 'Going');
      await addEventGuest(event2.insertId, user2.insertId, 'NotGoing');

      await addEventGuest(event3.insertId, user1.insertId, 'Invited');

      await addEventGuest(event4.insertId, user1.insertId, 'NotGoing');
    } catch (err) {
      console.log(err);
    }
  }

  describe('GET /me/events', () => {
    it('should GET a list of 4 events that user is attending / invited / not going', async () => {
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
      res.body.data.length.should.be.eql(4);
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
    });

    it('should GET a list of 2 events that the user is going (with filter)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Going: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user1.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(2);
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
    });

    it('should GET a list of 1 events that the user is invited (with filter)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Invited: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user1.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
    });

    it('should GET a list of 1 events that the user is notgoing (with filter)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ NotGoing: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user1.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
    });

    it('should GET a list of 2 events that the user is notgoing AND invited (with filter)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Invited: true, NotGoing: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user1.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(2);
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
    });

    it('should GET a list of 2 events that the user is notgoing AND invited (with filter and going = false)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Invited: true, NotGoing: true, Going: false })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user1.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(2);
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
    });

    it('should GET a list of 4 events that the user is notgoing AND invited AND going (with filter)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Invited: true, NotGoing: true, Going: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql(`The events for the user ${user1.insertId}`);
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(4);
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
    });

    it('should not GET a list of 4 events with invalid token', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Invited: true, NotGoing: true, Going: true })
        .set({ Authorization: `Bearer ${jwt}1` });

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');
    });

    it('should not GET events if the type of one of the filters is wrong', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Invited: 'test', NotGoing: true, Going: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Field Invited expected boolean received string');
    });

    it('should not GET events if one of the fields is wrong', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);
      // User1 is going to event 1, going to event 2, invited to event 3 and notgoing to event 4

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Unknown: true, NotGoing: true, Going: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Unknown field: Unknown');
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

    it('should GET a list of 1 event that user is invited with filter as string', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      await populateTables(user1, user2, user3);


      const jwt = generateJwt(user3.insertId);
      const res = await chai.request(server)
        .get('/api/me/events')
        .query({ Invited: 'true' })
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
