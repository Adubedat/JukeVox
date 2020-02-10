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

  async function addUserProfile() {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => console.log(err));
    return userProfile;
  }

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

  describe('PATCH /events/:eventId', () => {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    it('should PATCH an event', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const event = await addEvent(user.insertId);

      const updatedBody = {
        name: 'Warming house',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const res = await chai.request(server)
        .patch(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(updatedBody);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('eventId');
      res.body.message.should.be.eql('Event successfully updated!');
      res.body.data.name.should.be.eql('Warming house');

      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      createdEvents[0].Name.should.eql('Warming house');
      // TODO (?): check the rest of the elements are eql
    });

    it('should not PATCH an event with unknown id', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const event = await addEvent(user.insertId);

      const updatedBody = {
        name: 'Warming house',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const res = await chai.request(server)
        .patch(`/api/events/${event.insertId + 1}`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(updatedBody);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No event found with this ID');

      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      createdEvents[0].Name.should.eql('House warming');
      // TODO (?): check the rest of the elements are eql
    });

    it('should not PATCH an event with unknown fields', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const event = await addEvent(user.insertId);

      const updatedBody = {
        name: 'Warming house',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        unknown: 'unknown',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const res = await chai.request(server)
        .patch(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(updatedBody);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');

      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      createdEvents[0].Name.should.eql('House warming');
      // TODO (?): check the rest of the elements are eql
    });

    it('should not PATCH an event with invalid param in body', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);

      const event = await addEvent(user.insertId);

      const updatedBody = {
        name: 'Warming house',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: 'true',
        eventPicture: 'defaultPicture1',
      };

      const res = await chai.request(server)
        .patch(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(updatedBody);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Field isPrivate expected boolean received string');

      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(1);
      createdEvents[0].CreatorId.should.eql(user.insertId);
      createdEvents[0].Name.should.eql('House warming');
      // TODO (?): check the rest of the elements are eql
    });
  });
});

// TODO: Validate Body;
// TODO: Userid not match creator Id
