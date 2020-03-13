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

describe('Events', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  async function addEvent(creatorId) {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    const content = {
      name: 'House warming',
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

  async function addEventGuest(eventId, guestId, guestStatus) {
    const eventGuestQuery = 'insert into EventGuests (EventId, GuestId, HasPlayerControl, GuestStatus) VALUES ?';
    const eventGuestValues = [[eventId, guestId, false, guestStatus]];
    const eventGuest = await sql.query(eventGuestQuery, [eventGuestValues])
      .catch((err) => console.log(err));
    return eventGuest;
  }

  async function addUserProfile(userNumber) {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [[`Daniel${userNumber}`, `${userNumber}daniel@mail.com`, moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => console.log(err));
    return userProfile;
  }

  describe('GET /events/:eventId', () => {
    it('should GET an event', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id');
    });

    it('should GET an event (user is invited)', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      await addEventGuest(event.insertId, user.insertId, 'Invited');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id');
    });

    it('should GET an event (user is not going)', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      await addEventGuest(event.insertId, user.insertId, 'NotGoing');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id');
    });

    it('should not GET an event with unknown id', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId + 1}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No event found with this ID');
    });

    it('should not GET an event if the guest is not on the guest list', async () => {
      const user = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const jwt = generateJwt(user2.insertId);
      const event = await addEvent(user.insertId);
      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Forbidden');
    });
  });
});
