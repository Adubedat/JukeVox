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

  async function populateTables(user1, user2, user3, event1, event2, event3) {
    try {
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

  describe('GET /events/:eventId/guests', () => {
    it('should GET a list of 3 users attending the event', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event1.insertId}/guests`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('The guests for this event');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(3);
      res.body.data[0].should.have.all.keys('GuestStatus', 'Id', 'Username', 'ProfilePicture');
    });

    it('should GET a list of 2 users going to the event (filter going = true)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event1.insertId}/guests`)
        .query({ Going: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('The guests for this event');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(2);
      res.body.data[0].should.have.all.keys('GuestStatus', 'Id', 'Username', 'ProfilePicture');
    });

    it('should GET a list of 1 users going to the event (filter invited = true)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event1.insertId}/guests`)
        .query({ Invited: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('The guests for this event');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('GuestStatus', 'Id', 'Username', 'ProfilePicture');
    });

    it('should GET a list of NO users going to the event (filter NotGoing = true)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event1.insertId}/guests`)
        .query({ NotGoing: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No guests found for this event');
    });

    it('should GET a list of 3 users going to the event (filter invited = true going = true)', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event1.insertId}/guests`)
        .query({ Invited: true, Going: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('The guests for this event');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(3);
      res.body.data[0].should.have.all.keys('GuestStatus', 'Id', 'Username', 'ProfilePicture');
    });

    it('should not GET users with filter wrong type', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event1.insertId}/guests`)
        .query({ NotGoing: 'two' })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Field NotGoing expected boolean received string');
    });

    it('should not GET users with unkown filter', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event1.insertId}/guests`)
        .query({ Going: true, Unknown: true })
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Unknown field: Unknown');
    });


    it('should GET a list of 1 user attending the event', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user2.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event3.insertId}/guests`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('The guests for this event');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('GuestStatus', 'Id', 'Username', 'ProfilePicture');
      res.body.data[0].Id.should.be.eql(user1.insertId);
      res.body.data[0].GuestStatus.should.be.eql('Invited');
    });

    it('should not GET a list of users with unknown event', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/events/-1/guests')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No event with this id');
    });

    it('should not GET a list of users with jwt not matching creator of event', async () => {
      const user1 = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const user3 = await addUserProfile(3);
      const event1 = await addEvent(1, user1.insertId);
      const event2 = await addEvent(2, user1.insertId);
      const event3 = await addEvent(3, user2.insertId);
      await populateTables(user1, user2, user3, event1, event2, event3);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get(`/api/events/${event3.insertId}/guests`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');
    });
  });
});
