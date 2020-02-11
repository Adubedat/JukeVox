/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { generateJwt } from '../../src/helpers/utils';

import Database from '../../src/helpers/database';

const sql = new Database();
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Friendships', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts');
    await sql.query('DELETE FROM Friendships;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('POST /api/me/friendships', () => {
    it('should create a friendship with valid addressee Id', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);
      const body = {
        addresseeId: user2.insertId,
      };
      const res = await chai.request(server)
        .post('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Friendship created');

      const [friendship] = await sql.query('SELECT * FROM Friendships');
      friendship.RequesterId.should.eql(user1.insertId);
      friendship.AddresseeId.should.eql(user2.insertId);
    });
    it('should not create a friendship without addressee Id', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .post('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError addresseeId: expected number but received undefined');

      const [friendship] = await sql.query('SELECT * FROM Friendships');
      expect(friendship).to.equal(undefined);
    });
    it('should not create a friendship with invalid addressee Id', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);
      const body = {
        addresseeId: -1,
      };
      const res = await chai.request(server)
        .post('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('addresseeId must match an existing user');

      const [friendship] = await sql.query('SELECT * FROM Friendships');
      expect(friendship).to.equal(undefined);
    });
    it('should not create a friendship without jwt', async () => {
      await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');

      const body = {
        addresseeId: user2.insertId,
      };
      const res = await chai.request(server)
        .post('/api/me/friendships')
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');

      const [friendship] = await sql.query('SELECT * FROM Friendships');
      expect(friendship).to.equal(undefined);
    });
    it('should not create a friendship with an unknown field', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);
      const body = {
        addresseeId: user2.insertId,
        unknown: 'unknown',
      };
      const res = await chai.request(server)
        .post('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');

      const [friendship] = await sql.query('SELECT * FROM Friendships');
      expect(friendship).to.equal(undefined);
    });
  });
});
