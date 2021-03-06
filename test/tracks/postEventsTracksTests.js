/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import sql from '../../src/helpers/database';
import { generateJwt } from '../../src/helpers/utils';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();

chai.use(chaiHttp);

describe('Tracks', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM Tracks;');
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM Tracks;');
    await sql.query('DELETE FROM EventGuests');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('POST /api/events/:eventId/tracks', () => {
    it('should add a track with correct params', async () => {
      const body = {
        deezerSongId: 1109731,
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Track successfully added to the event');
      res.should.have.status(201);
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.data.should.have.property('EventId');
      res.body.data.should.have.property('UserId');
      res.body.data.should.have.property('DeezerSongId');
      res.body.data.should.have.property('Title');
      res.body.data.should.have.property('Duration');
      res.body.data.should.have.property('ArtistName');
      res.body.data.should.have.property('PictureSmall');
      res.body.data.should.have.property('PictureBig');
      res.body.data.should.have.property('AddedAt');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(1);
    });
    it('should not add a track if event does not exist', async () => {
      const body = {
        deezerSongId: 1109731,
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post('/api/events/-1/tracks')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Forbidden : Event does not exist or you are not part of it');
      res.should.have.status(403);

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
    it('should not add a track if user is not part of the event', async () => {
      const body = {
        deezerSongId: 1109731,
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Forbidden : Event does not exist or you are not part of it');
      res.should.have.status(403);

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
    it('should not add a track if user is not going to the event', async () => {
      const body = {
        deezerSongId: 1109731,
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'NotGoing')`);

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Forbidden : You must be going to the event to add a song');
      res.should.have.status(403);

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
    it('should not add a track with an unknown field', async () => {
      const body = {
        deezerSongId: 1109731,
        unknown: 'unknown',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Unknown field: unknown');
      res.should.have.status(400);

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
    it('should not add a track without jwt', async () => {
      const body = {
        deezerSongId: 1109731,
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Authorization token is missing');
      res.should.have.status(401);

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
    it('should not add a track without deezerSongId', async () => {
      const body = {
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('TypeError deezerSongId: expected number but received undefined');
      res.should.have.status(400);

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
    it('should not add a track with an invalid deezerSongId', async () => {
      const body = {
        deezerSongId: -1,
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Invalid deezerSongId');
      res.should.have.status(400);

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
  });
});
