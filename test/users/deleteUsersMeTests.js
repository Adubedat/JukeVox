/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import argon2 from 'argon2';
import Database from '../../src/helpers/database';
import { generateJwt } from '../../src/server/controller/userController';

const sql = new Database();
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('/DELETE /users/me', () => {
    it('should DELETE personnal user account', async () => {
      const body = {
        password: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const user2 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user2\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      await sql.query(`INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId) VALUES (${user1.insertId}, 'Google', 'test')`);
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user1.insertId}, ${user2.insertId})`);
      await sql.query(`INSERT INTO Friendships (RequesterId, AddresseeId) VALUES (${user2.insertId}, ${user1.insertId})`);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/users/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      const userAccounts = await sql.query('SELECT * FROM UserAccounts');
      const providerAccounts = await sql.query('SELECT * FROM ProviderAccounts');
      const friendships = await sql.query('SELECT * FROM Friendships');
      const userProfile = await sql.query('SELECT * FROM UserProfiles');
      userAccounts.should.have.lengthOf(0);
      providerAccounts.should.have.lengthOf(0);
      friendships.should.have.lengthOf(0);
      userProfile.should.have.lengthOf(2);
      expect(userProfile[0].Username).to.equal(null);
      expect(userProfile[0].Email).to.equal(null);
      expect(userProfile[0].ProfilePicture).to.equal(null);
    });
    it('should not DELETE user without password', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email) VALUES (${user1.insertId}, 'test@test.test')`);
      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/users/me')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Missing field in body : password');
      const userAccounts = await sql.query('SELECT * FROM UserAccounts');
      userAccounts.should.have.lengthOf(1);
    });
    it('should not DELETE user with an invalid password', async () => {
      const body = {
        password: 'wrongPassword',
      };
      const hash = await argon2.hash('aaaaaaaaaa');
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/users/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Invalid password');
      const userAccounts = await sql.query('SELECT * FROM UserAccounts');
      userAccounts.should.have.lengthOf(1);
    });
  });
  it('should not DELETE user with a wrong id in jwt', async () => {
    const body = {
      password: 'aaaaaaaaaa',
    };
    const hash = await argon2.hash(body.password);
    const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
    await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
    const jwt = generateJwt(-1);
    const res = await chai.request(server)
      .delete('/api/users/me')
      .set({ Authorization: `Bearer ${jwt}` })
      .send(body);

    res.should.have.status(404);
    res.body.should.be.a('object');
    res.body.should.have.property('statusCode');
    res.body.should.have.property('message');
    res.body.message.should.eql('No account found: Wrong token provided');
    const userAccounts = await sql.query('SELECT * FROM UserAccounts');
    userAccounts.should.have.lengthOf(1);
  });
  it('should not DELETE user without jwt', async () => {
    const body = {
      password: 'aaaaaaaaaa',
    };
    const hash = await argon2.hash(body.password);
    const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
    await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
    const res = await chai.request(server)
      .delete('/api/users/me')
      .send(body);

    res.should.have.status(401);
    res.body.should.be.a('object');
    res.body.should.have.property('statusCode');
    res.body.should.have.property('message');
    res.body.message.should.eql('Authorization token is missing');
    const userAccounts = await sql.query('SELECT * FROM UserAccounts');
    userAccounts.should.have.lengthOf(1);
  });
  it('should not DELETE user without jwt', async () => {
    const body = {
      password: 'aaaaaaaaaa',
    };
    const hash = await argon2.hash(body.password);
    const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
    await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
    let jwt = generateJwt(user1.insertId);
    jwt = jwt.substring(0, jwt.length - 1);
    const res = await chai.request(server)
      .delete('/api/users/me')
      .set({ Authorization: `Bearer ${jwt}` })
      .send(body);

    res.should.have.status(401);
    res.body.should.be.a('object');
    res.body.should.have.property('statusCode');
    res.body.should.have.property('message');
    res.body.message.should.eql('Invalid authorization token');
    const userAccounts = await sql.query('SELECT * FROM UserAccounts');
    userAccounts.should.have.lengthOf(1);
  });
});
