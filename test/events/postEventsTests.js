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
    await sql.query('DELETE FROM Logs');
    await sql.query('DELETE FROM EventGuests;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM Logs');
    await sql.query('DELETE FROM EventGuests;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  async function addUserProfile() {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => console.log(err));
    return userProfile;
  }


  describe('/POST /events', () => {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    it('should POST an event with a guest', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
        restrictVotingToEventHours: true,
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');

      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql('Event successfully created!');

      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      createdEvents[0].should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id');

      const eventGuests = await sql.query('SELECT * FROM EventGuests');

      eventGuests.should.have.lengthOf(1);
      eventGuests[0].EventId.should.eql(res.body.data.Id);
      eventGuests[0].GuestId.should.eql(user.insertId);
      eventGuests[0].HasPlayerControl.should.eql(1);
      eventGuests[0].GuestStatus.should.eql('Going');
    });

    it('should not POST an event with a jwt that matches no user', async () => {
      const body = {
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

      const jwt = generateJwt(-1);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Invalid authorization token');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event without a jwt', async () => {
      const body = {
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

      await addUserProfile();

      const res = await chai.request(server)
        .post('/api/events')
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });


    it('should not POST an event with an invalid jwt', async () => {
      const body = {
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

      const user = await addUserProfile();
      let jwt = generateJwt(user.insertId);
      jwt = jwt.substring(0, jwt.length - 1);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Invalid authorization token');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with an unknown field and not make an event guest', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        unknown: 'unknown',
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);

      const eventGuests = await sql.query('SELECT * FROM EventGuests');

      eventGuests.should.have.lengthOf(0);
    });

    it('should not POST an event with name too long', async () => {
      const body = {
        name: 'a'.repeat(101),
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

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Name is too long');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with name = null', async () => {
      const body = {
        name: null,
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

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field name expected string received object');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with description too long', async () => {
      const body = {
        name: 'House warming',
        description: 'a'.repeat(2049),
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Description is too long');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with start date more than 1 hour in the past', async () => {
      const startDateBeforeNow = moment().subtract(2, 'h').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate: startDateBeforeNow,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('The date cannot be in the past');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with end date before start date + 1 hour', async () => {
      const startDateNow = moment().format(DATETIME_FORMAT);
      const endDateInHalfAnHour = moment().add(30, 'm').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate: startDateNow,
        endDate: endDateInHalfAnHour,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('The end date must be > (startDate + 1 hour)');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should POST an event with a start date < 1 hour before now', async () => {
      const startDateHalfHourBeforeNow = moment().subtract(30, 'm').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate: startDateHalfHourBeforeNow,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
        restrictVotingToEventHours: true,
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql('Event successfully created!');


      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      createdEvents[0].should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id');

      const eventGuests = await sql.query('SELECT * FROM EventGuests');

      eventGuests.should.have.lengthOf(1);
      eventGuests[0].EventId.should.eql(res.body.data.Id);
      eventGuests[0].GuestId.should.eql(user.insertId);
      eventGuests[0].HasPlayerControl.should.eql(1);
      eventGuests[0].GuestStatus.should.eql('Going');
    });

    it('should not POST an event with end date > startDate + 1 week', async () => {
      const startDateNow = moment().format(DATETIME_FORMAT);
      const endDateInAWeek = moment().add(1, 'w').add(1, 'm').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate: startDateNow,
        endDate: endDateInAWeek,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('The end date must be < (startDate + 1 week)');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with start date wrong type', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field startDate expected string received undefined');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with end date wrong type', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field endDate expected string received undefined');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with start date wrong format', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate: moment().add(3, 'd').format('DD-MM-YYY HH:mm:ss'),
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Start date incorrectly formatted');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with end date wrong format', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate: moment().add(5, 'd').format('DD-MM-YYY HH:mm:ss'),
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('End date incorrectly formatted');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with unknown latitude', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 91,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown latitude');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with unknown longitude', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: -181,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown longitude');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with a latitude of wrong type', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: '48.8915482',
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field latitude expected number received string');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with a longitude of wrong type', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: '2.3170656',
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field longitude expected number received string');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with wrong streamerDevice field type', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: true,
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field streamerDevice expected string received boolean');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with no wrong private field type', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abc',
        isPrivate: 1,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field isPrivate expected boolean received number');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with wrong location field type', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: 45,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abc',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field location expected string received number');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with location field too long', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: 'a'.repeat(101),
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abc',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Location is too long');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });
  });
});
