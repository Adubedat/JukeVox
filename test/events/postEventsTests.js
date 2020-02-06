/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';
import Database from '../../src/helpers/database';

import { generateJwt } from '../../src/server/controller/userController';

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
    await sql.query('DELETE FROM UserProfiles;');
    await sql.query('DELETE FROM Events;');
  });

  async function addUserProfile() {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues]).catch((err) => console.log(err));
    return userProfile;
  }


  describe('/POST /events', () => {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    it('should POST an event', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.be.eql(body);

      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      // TODO (?): check the rest of the elements are eql
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
      };

      const jwt = generateJwt(-1);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No account found: Wrong token provided');
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

    it('should not POST an event with an unknown field', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
    });

    it('should not POST an event with name too long', async () => {
      const body = {
        name: 'a'.repeat(101),
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.eql('Missing field: name');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with description too long', async () => {
      const body = {
        name: 'House warming',
        description: 'a'.repeat(2049),
        startDate,
        endDate,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      const startDateBeforeNow = moment().subtract(1, 'h').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDateBeforeNow,
        endDate,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.eql('The event cannot be in the past');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with end date before start date + 1 hour', async () => {
      const startDateNow = moment().format(DATETIME_FORMAT);
      const endDateInHalfAnHour = moment().add(30, 'm').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDateNow,
        endDateInHalfAnHour,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.eql('The end date must be > (start date + 1 hour)');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should POST an event with a start date < 1 hour before now', async () => {
      const startDateHalfHourBeforeNow = moment().subtract(30, 'm').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDateHalfHourBeforeNow,
        endDate,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.be.eql(body);

      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      // TODO (?): check the rest of the elements are eql
    });

    it('should not POST an event with end date > startDate + 1 week', async () => {
      const startDateNow = moment().format(DATETIME_FORMAT);
      const endDateInAWeek = moment().add(1, 'w').format(DATETIME_FORMAT);
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDateNow,
        endDateInAWeek,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.eql('The end date must be < (start date + 1 week)');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with no start date field', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        endDate,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.eql('Missing field: start date');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with no end date field', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.eql('Missing field: end date');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    it('should not POST an event with no end date field', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        unknown: 'unknown',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
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
      res.body.message.should.eql('Missing field: end date');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);
    });

    // COMPLETED: should not POST an event with a start date > 1hour before now
    // COMPLETED: should POST an event with a start date < 1 hour before now
    // COMPLETED: should not POST an event with end date < startDate + 1hour
    // COMPLETED: should not POST an event with end date > startDate + 1 week
    // COMPLETED: should not POST an event with no start date field (and type)
    // TODO: should not POST an event with start date wrong format
    // COMPLETED: should not POST an event with no end date field (and type)
    // TODO: should not POST an event with end date wrong format
    // TODO: should not POST an event with unknown latitude
    // TODO: should not POST an event with unknown longitude
    // TODO: should not POST an event with no latitude field (and type)
    // TODO: should not POST an event with no longitude field (and type)
    // TODO: should not POST an event with no streamerDevice field
    // TODO: should not POST an event with no private property ifeld


    // TODO: Discuss with others if there should be a min / max lenght for an event
  });
});
