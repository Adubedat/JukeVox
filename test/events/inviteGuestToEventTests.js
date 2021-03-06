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

describe('Invite', () => {
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

  async function addEvent(nameId, creatorId, isPrivate = true) {
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
      .catch((err) => logger.error(err));
    return event;
  }

  async function addUserProfile(userNumber) {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [[`Daniel${userNumber}`, `${userNumber}daniel@mail.com`, moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => logger.error(err));
    return userProfile;
  }

  async function addEventGuest(eventId, guestId, guestStatus) {
    const eventGuestQuery = 'insert into EventGuests (EventId, GuestId, HasPlayerControl, GuestStatus) VALUES ?';
    const eventGuestValues = [[eventId, guestId, false, guestStatus]];
    const eventGuest = await sql.query(eventGuestQuery, [eventGuestValues])
      .catch((err) => logger.error(err));
    return eventGuest;
  }

  describe('POST /invite', () => {
    it('should POST a guest to an event (invite)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql(`User ${user2.insertId} invited to event ${event1.insertId}`);

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('Invited');
    });

    it('should POST a guest to a public event (going)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId, false);

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user2.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql(`User ${user2.insertId} invited to event ${event1.insertId}`);

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('Going');
    });

    it('should not POST a guest to a public event (going) if requester != guest', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user3.insertId, false);

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(0);
    });

    it('should POST a guest to a public event (invited) if requester == creator', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId, false);

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql(`User ${user2.insertId} invited to event ${event1.insertId}`);

      const guestStatuses = await sql.query('SELECT * FROM EventGuests;');
      guestStatuses.should.have.lengthOf(1);
      guestStatuses[0].GuestStatus.should.eql('Invited');
    });

    it('should not POST a guest to an event (invite) with invalid jwt', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}a` })
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');
    });

    it('should not POST a guest to an event with unknown field in body', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
        unknown: 'unknown',
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Unknown field: unknown');
    });

    it('should not POST a guest to an event with wrong type field for eventId', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: '1',
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Field eventId expected number received string');
    });

    it('should not POST a guest to an event with wrong type field for guestId', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: event1.insertId,
        guestId: '1',
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Field guestId expected number received string');
    });

    it('should not POST a guest to an unknown event', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: -1,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No event with this ID');
    });

    it('should not POST a guest to if the JWT does not match the creator of the event', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user2.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');
    });

    it('should not POST a guest to if the guest does not exist', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);

      const body = {
        eventId: event1.insertId,
        guestId: -1,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No user with this ID');
    });

    it('should not POST a guest to if the guest is already invited', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const event1 = await addEvent(1, user1.insertId);
      await addEventGuest(event1.insertId, user2.insertId, 'Going');

      const body = {
        eventId: event1.insertId,
        guestId: user2.insertId,
      };

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .post('/api/invite')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(409);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Guest already invited or attending');

      const invited = await sql.query('SELECT * FROM EventGuests');
      invited.should.have.lengthOf(1);
    });
  });
});
