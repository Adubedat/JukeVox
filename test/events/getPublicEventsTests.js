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
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  async function addEvent(creatorId, isPrivate, day = 3) {
    const startDate = moment().add(day, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    const content = {
      name: `House warming${day}`,
      description: 'All come over on wednesday for our housewarming!',
      startDate,
      endDate,
      location: '46 tests street',
      latitude: 48.8915482,
      longitude: 2.3170656,
      streamerDevice: 'abcd',
      isPrivate,
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

  describe('GET /api/events/', () => {
    it('should GET an event', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId, true);
      const event2 = await addEvent(user.insertId, false);
      const event3 = await addEvent(user.insertId, false);

      const res = await chai.request(server)
        .get('/api/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data[0].should.have.property('Id');
      res.body.message.should.be.eql('The public events are: ');
      res.body.data[0].Name.should.be.eql('House warming3');
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
      res.body.data[0].Id.should.be.eql(event2.insertId);
      res.body.data.length.should.be.eql(2);
    });

    it('should GET events in chronological order', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId, true);
      const event2 = await addEvent(user.insertId, false, 1);
      const event3 = await addEvent(user.insertId, false, 3);
      const event4 = await addEvent(user.insertId, false, 2);

      const res = await chai.request(server)
        .get('/api/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data[0].should.have.property('Id');
      res.body.message.should.be.eql('The public events are: ');
      res.body.data[0].Name.should.be.eql('House warming1');
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
      res.body.data.length.should.be.eql(3);
      res.body.data[0].Id.should.be.eql(event2.insertId);
      res.body.data[1].Id.should.be.eql(event4.insertId);
      res.body.data[2].Id.should.be.eql(event3.insertId);
    });

    it('should GET events in chronological order (check for guestStatus)', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId, true);
      const event2 = await addEvent(user.insertId, false, 1);
      const event3 = await addEvent(user.insertId, false, 3);
      const event4 = await addEvent(user.insertId, false, 2);

      await addEventGuest(event.insertId, user.insertId, 'Going');
      await addEventGuest(event2.insertId, user.insertId, 'Invited');
      await addEventGuest(event3.insertId, user.insertId, 'NotGoing');

      const res = await chai.request(server)
        .get('/api/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data[0].should.have.property('Id');
      res.body.message.should.be.eql('The public events are: ');
      res.body.data[0].Name.should.be.eql('House warming1');
      res.body.data[0].should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'GuestStatus');
      res.body.data.length.should.be.eql(3);
      res.body.data[0].Id.should.be.eql(event2.insertId);
      res.body.data[0].GuestStatus.should.be.eql('Invited');
      res.body.data[1].Id.should.be.eql(event4.insertId);
      res.body.data[2].Id.should.be.eql(event3.insertId);
      res.body.data[2].GuestStatus.should.be.eql('NotGoing');
    });

    it('should not GET an event with an invalid jwt', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId, true);
      const event2 = await addEvent(user.insertId, false);
      const event3 = await addEvent(user.insertId, false);

      const res = await chai.request(server)
        .get('/api/events')
        .set({ Authorization: `Bearer ${jwt}a` });

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');
    });


    it('should not GET an event if the list is empty', async () => {
      const user = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const jwt = generateJwt(user2.insertId, true);
      const event = await addEvent(user.insertId, true);

      const res = await chai.request(server)
        .get('/api/events')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No public events found');
    });
  });
});
