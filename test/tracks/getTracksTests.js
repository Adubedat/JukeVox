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

describe('Users', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('GET /api/tracks', () => {
    it('should GET a track list with correct params', async () => {
      const query = {
        query: 'eminem',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .get('/api/tracks')
        .set({ Authorization: `Bearer ${jwt}` })
        .query(query);

      res.should.have.status(200);
      res.body.should.have.property('message');
      res.body.should.have.property('statusCode');
      res.body.message.should.eql('Tracks found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array');
      res.body.data[0].should.have.property('deezerSongId');
      res.body.data[0].should.have.property('title');
      res.body.data[0].should.have.property('duration');
      res.body.data[0].should.have.property('artistName');
      res.body.data[0].should.have.property('pictureSmall');
      res.body.data[0].should.have.property('pictureBig');
    });

    it('should not GET a track list without query param', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .get('/api/tracks')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError query: expected string but received undefined');
    });

    it('should not GET a track list without jwt', async () => {
      const query = {
        query: 'eminem',
      };

      const res = await chai.request(server)
        .get('/api/tracks')
        .query(query);

      res.should.have.status(401);
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');
    });

    it('should not GET a track list with unknown parameter', async () => {
      const query = {
        query: 'eminem',
        unknown: 'unknown',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .get('/api/tracks')
        .set({ Authorization: `Bearer ${jwt}` })
        .query(query);

      res.should.have.status(400);
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');
    });
  });
});
