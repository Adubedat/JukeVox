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

  describe('POST /api/me/events/:eventId/playerControl', () => {
    it('should update the player control of a guest', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(host.insertId);

      const body = {
        guestId: user2.insertId,
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql(`User ${user2.insertId} can now control the player`);

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(1);
    });

    it('should not update the player control of a guest with unknown fields', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(host.insertId);

      const body = {
        guestId: user2.insertId,
        unknown: 'unknown',
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Unknown field: unknown');

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);
    });

    it('should not update the player control of a guest with wrong type', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(host.insertId);

      const body = {
        guestId: '1',
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Field guestId expected number received string');

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);
    });

    it('should not update the player control of a guest with unknown event', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(host.insertId);

      const body = {
        guestId: user2.insertId,
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId + 1}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No event with this ID');

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);
    });

    it('should not update the player control of a guest with jwt != event creator', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(user2.insertId);

      const body = {
        guestId: user2.insertId,
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);
    });

    it('should not update the player control of a guest with unknown guest ID', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(host.insertId);

      const body = {
        guestId: -1,
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('User not attending event');

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);
    });

    it('should not update the player control of a guest if they are not going', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Invited');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(host.insertId);

      const body = {
        guestId: user2.insertId,
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('User not attending event');

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);
    });

    it('should not update the player control of a guest with invalid jwt', async () => {
      const host = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event = await addEvent(1, host.insertId);
      const eventGuest = await addEventGuest(event.insertId, host.insertId, 'Going');
      const eventGuest2 = await addEventGuest(event.insertId, user2.insertId, 'Going');


      let guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);

      const jwt = generateJwt(host.insertId);

      const body = {
        guestId: user2.insertId,
      };

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/playerControl`)
        .set({ Authorization: `Bearer ${jwt}a` })
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');

      guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(2);
      guestStatuses[1].HasPlayerControl.should.eql(0);
    });
  });
});
