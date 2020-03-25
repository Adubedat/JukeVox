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

  describe('PATCH /api/me/events/:eventId/guestStatus', () => {
    it('should update the guest status of a guest', async () => {
      const user1 = await addUserProfile(1);
      const event = await addEvent(1, user1.insertId);
      const eventGuest = await addEventGuest(event.insertId, user1.insertId, 'Going');

      const jwt = generateJwt(user1.insertId);

      const body = {
        guestStatus: 'NotGoing',
      };

      const res = await chai.request(server)
        .patch(`/api/me/events/${event.insertId}/guestStatus`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('GuestStatus successfully updated!');

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('NotGoing');
    });

    it('should not update the guest status of a guest with invalid jwt', async () => {
      const user1 = await addUserProfile(1);
      const event = await addEvent(1, user1.insertId);
      const eventGuest = await addEventGuest(event.insertId, user1.insertId, 'Going');

      const jwt = generateJwt(user1.insertId);

      const body = {
        guestStatus: 'NotGoing',
      };

      const res = await chai.request(server)
        .patch(`/api/me/events/${event.insertId}/guestStatus`)
        .set({ Authorization: `Bearer ${jwt}a` })
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');
    });

    it('should not update the guest status if the body has wrong string', async () => {
      const user1 = await addUserProfile(1);
      const event = await addEvent(1, user1.insertId);
      const eventGuest = await addEventGuest(event.insertId, user1.insertId, 'NotGoing');

      const jwt = generateJwt(user1.insertId);

      const body = {
        guestStatus: 'going',
      };

      const res = await chai.request(server)
        .patch(`/api/me/events/${event.insertId}/guestStatus`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Status must be either Going or NotGoing');

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('NotGoing');
    });

    it('should not update the guest status if the body has unknown fields', async () => {
      const user1 = await addUserProfile(1);
      const event = await addEvent(1, user1.insertId);
      const eventGuest = await addEventGuest(event.insertId, user1.insertId, 'NotGoing');

      const jwt = generateJwt(user1.insertId);

      const body = {
        guestStatus: 'Going',
        unknown: 'unknown',
      };

      const res = await chai.request(server)
        .patch(`/api/me/events/${event.insertId}/guestStatus`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Unknown field: unknown');

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('NotGoing');
    });

    it('should not update the guest status if the body is wrong type', async () => {
      const user1 = await addUserProfile(1);
      const event = await addEvent(1, user1.insertId);
      const eventGuest = await addEventGuest(event.insertId, user1.insertId, 'NotGoing');

      const jwt = generateJwt(user1.insertId);

      const body = {
        guestStatus: false,
      };

      const res = await chai.request(server)
        .patch(`/api/me/events/${event.insertId}/guestStatus`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Field guestStatus expected string received boolean');

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('NotGoing');
    });

    it('should not update the guest status if the guest is not on guestlist', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);

      const event = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const eventGuest = await addEventGuest(event.insertId, user1.insertId, 'NotGoing');
      const eventGuest2 = await addEventGuest(event2.insertId, user2.insertId, 'Invited');

      const jwt = generateJwt(user2.insertId);

      const body = {
        guestStatus: 'Going',
      };

      const res = await chai.request(server)
        .patch(`/api/me/events/${event.insertId}/guestStatus`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].GuestStatus.should.eql('Invited');
    });

    it('should not update the guest status if the event does not exist', async () => {
      const user1 = await addUserProfile(1);
      const event = await addEvent(1, user1.insertId);
      const eventGuest = await addEventGuest(event.insertId, user1.insertId, 'NotGoing');

      const jwt = generateJwt(user1.insertId);

      const body = {
        guestStatus: 'Going',
      };

      const res = await chai.request(server)
        .patch(`/api/me/events/${event.insertId + 1}/guestStatus`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No event found with this ID');

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('NotGoing');
    });
  });
});
