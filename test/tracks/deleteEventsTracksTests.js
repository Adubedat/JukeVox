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
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM Tracks;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('DELETE /api/events/:eventId/tracks', () => {
    it('should delete a track with correct params') {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      const track = await sql.query(`INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (${event.insertId}, ${user1.insertId}, 1, 'test', 345, 'test', 'test', '2031-05-05 05:05:05')`)

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
    }
  })
});
