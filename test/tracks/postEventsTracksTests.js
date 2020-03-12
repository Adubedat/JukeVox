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
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('POST /api/events/:eventId/tracks', () => {
    it('should add a track with correct params', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
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
      res.body.data.should.have.property('id');
      res.body.data.should.have.property('eventId');
      res.body.data.should.have.property('userId');
      res.body.data.should.have.property('deezerSongId');
      res.body.data.should.have.property('title');
      res.body.data.should.have.property('duration');
      res.body.data.should.have.property('artistName');
      res.body.data.should.have.property('pictureSmall');
      res.body.data.should.have.property('pictureBig');
    });
    it('should not add a track if event does not exist', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
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
    });
    it('should not add a track if user is not part of the event', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Forbidden : Event does not exist or you are not part of it');
      res.should.have.status(403);
    });
    it('should not add a track with an unknown field', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
        unknown: 'unknown',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
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
    });
    it('should not add a track without jwt', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Authorization token is missing');
      res.should.have.status(401);
    });
    it('should not add a track without deezerSongId', async () => {
      const body = {
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
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
    });
    it('should not add a track without title', async () => {
      const body = {
        deezerSongId: 1109731,
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('TypeError title: expected string but received undefined');
      res.should.have.status(400);
    });
    it('should not add a track without duration', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('TypeError duration: expected number but received undefined');
      res.should.have.status(400);
    });
    it('should not add a track without artistName', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('TypeError artistName: expected string but received undefined');
      res.should.have.status(400);
    });
    it('should not add a track without pictureSmall', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('TypeError pictureSmall: expected string but received undefined');
      res.should.have.status(400);
    });
    it('should not add a track without pictureBig', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('TypeError pictureBig: expected string but received undefined');
      res.should.have.status(400);
    });
    it('should not add a track with an invalid deezerSongId', async () => {
      const body = {
        deezerSongId: -1,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
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
    });
    it('should not add a track with invalid duration', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 327,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('The given duration does not correspond to the deezer duration');
      res.should.have.status(400);
    });
    it('should not add a track with an invalid title', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'error Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('The given title does not correspond to the deezer title');
      res.should.have.status(400);
    });
    it('should not add a track with an invalid artistName', async () => {
      const body = {
        deezerSongId: 1109731,
        title: 'Lose Yourself (From "8 Mile" Soundtrack)',
        duration: 326,
        artistName: 'error Eminem',
        pictureSmall: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/56x56-000000-80-0-0.jpg',
        pictureBig: 'https://cdns-images.dzcdn.net/images/cover/e2b36a9fda865cb2e9ed1476b6291a7d/500x500-000000-80-0-0.jpg',
      };

      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const event = await sql.query(`INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Latitude, Longitude) VALUES (${user1.insertId}, 'user1', '2030-12-12 12:12:12', '2031-12-12 12:12:12', 30.24, 30.35)`);
      await sql.query(`INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (${event.insertId}, ${user1.insertId}, 'Going')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post(`/api/events/${event.insertId}/tracks`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('The given artistName does not correspond to the deezer artistName');
      res.should.have.status(400);
    });
  });
});
