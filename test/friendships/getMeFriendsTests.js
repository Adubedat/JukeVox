/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { generateJwt } from '../../src/helpers/utils';

import sql from '../../src/helpers/database';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();

chai.use(chaiHttp);

describe('Friendships', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM Friendships;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM Friendships;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('GET /api/me/friends', () => {
    it('should get all friendships', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      const user3 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user3\', \'test3@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user3.insertId})`);
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user2.insertId}, ${user1.insertId})`);
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user2.insertId}, ${user3.insertId})`);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .get('/api/me/friends')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('friends');
      res.body.friends.should.have.lengthOf(2);
      res.body.friends[0].Id.should.eql(user2.insertId);
      res.body.friends[1].Id.should.eql(user3.insertId);
    });
    it('should not get friendships without jwt', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test2@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);

      const res = await chai.request(server)
        .get('/api/me/friends');

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');
    });
  });
});
