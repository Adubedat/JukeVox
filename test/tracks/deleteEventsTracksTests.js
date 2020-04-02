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
    await sql.query('DELETE FROM Votes;');
    await sql.query('DELETE FROM Tracks;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM Votes;');
    await sql.query('DELETE FROM Tracks;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('DELETE /api/events/:eventId/tracks', () => {
    it('should delete a track with correct params', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const track = await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', '2031-05-05 05:05:05')`);

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .delete(`/api/events/${event.insertId}/tracks/${track.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);
    });
    it('should delete a track and associated votes with correct params', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const track = await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', '2031-05-05 05:05:05')`);
      await sql.query(`INSERT INTO Votes (TrackId, UserId, Vote) VALUES(${track.insertId}, ${user1.insertId}, 1);`);

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .delete(`/api/events/${event.insertId}/tracks/${track.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(0);

      const votes = await sql.query('SELECT * FROM Votes');
      votes.should.have.lengthOf(0);
    });
    it('should not delete a track if the track does not exist', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', '2031-05-05 05:05:05')`);

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .delete(`/api/events/${event.insertId}/tracks/-1`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Track not found');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(1);
    });
    it('should not delete a track if event does not exist', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const track = await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', '2031-05-05 05:05:05')`);

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .delete(`/api/events/-1/tracks/${track.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Event not found');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(1);
    });
    it('should not delete a track if track is not in the given event', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const event2 = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const track = await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', '2031-05-05 05:05:05')`);

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .delete(`/api/events/${event2.insertId}/tracks/${track.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Track not found');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(1);
    });
    it('should not delete a track if the user is not the event admin', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const track = await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', '2031-05-05 05:05:05')`);

      const jwt = generateJwt(user2.insertId);

      const res = await chai.request(server)
        .delete(`/api/events/${event.insertId}/tracks/${track.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Only the event\'s creator can delete tracks');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(1);
    });
    it('should not delete a track without jwt', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 'test', 30.24, 30.35)`);
      const track = await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', '2031-05-05 05:05:05')`);


      const res = await chai.request(server)
        .delete(`/api/events/${event.insertId}/tracks/${track.insertId}`);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');

      const tracks = await sql.query('SELECT * FROM Tracks');
      tracks.should.have.lengthOf(1);
    });
  });
});
