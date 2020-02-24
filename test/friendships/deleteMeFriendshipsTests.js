/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { generateJwt } from '../../src/helpers/utils';

import sql from '../../src/helpers/database';

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

  describe('DELETE /api/me/friendships', () => {
    it('should delete friendship with valid addresseeId', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      const user3 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user3\', \'test3@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user3.insertId})`);

      const jwt = generateJwt(user1.insertId);
      const body = {
        addresseeId: user2.insertId,
      };
      const res = await chai.request(server)
        .delete('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const friendships = await sql.query('SELECT * FROM Friendships');
      friendships.should.have.lengthOf(1);
      friendships[0].AddresseeId.should.eql(user3.insertId);
    });
    it('should not delete friendship with invalid addresseId', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);
      const body = {
        addresseeId: -1,
      };
      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('addresseeId must match an existing user');

      const friendships = await sql.query('SELECT * FROM Friendships');
      friendships.should.have.lengthOf(1);
      friendships[0].AddresseeId.should.eql(user2.insertId);
    });
    it('should not delete friendship without addresseeId', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError addresseeId: expected number but received undefined');

      const friendships = await sql.query('SELECT * FROM Friendships');
      friendships.should.have.lengthOf(1);
      friendships[0].AddresseeId.should.eql(user2.insertId);
    });
    it('should not delete friendship without jwt', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);
      const body = {
        addresseeId: user2.insertId,
      };
      const res = await chai.request(server)
        .delete('/api/me/friendships')
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');

      const friendships = await sql.query('SELECT * FROM Friendships');
      friendships.should.have.lengthOf(1);
      friendships[0].AddresseeId.should.eql(user2.insertId);
    });
    it('should not delete friendship with an unknown field', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);
      const body = {
        addresseeId: user2.insertId,
        unknown: 'unknown',
      };
      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/me/friendships')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');

      const friendships = await sql.query('SELECT * FROM Friendships');
      friendships.should.have.lengthOf(1);
      friendships[0].AddresseeId.should.eql(user2.insertId);
    });
  });
});
