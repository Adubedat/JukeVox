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

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('PATCH /api/me', () => {
    it('should update userProfile with different username and profilePicture', async () => {
      const body = {
        username: 'newUserName',
        profilePicture: 'newProfilePicture',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql(body.username);
      updatedUser.ProfilePicture.should.eql(body.profilePicture);
    });
    it('should update userProfile with same username and different profilePicture', async () => {
      const body = {
        username: 'user1',
        profilePicture: 'newProfilePicture',
      };
      const user1 = await sql.query(`INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES ('${body.username}', 'test@test,test', 'profilePicture', '2020-12-12 12:12:12')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql(body.username);
      updatedUser.ProfilePicture.should.eql(body.profilePicture);
    });
    it('should update userProfile with different username and same profilePicture', async () => {
      const body = {
        username: 'newUsername',
        profilePicture: 'profilePicture',
      };
      const user1 = await sql.query(`INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES ('user1', 'test@test,test', '${body.profilePicture}', '2020-12-12 12:12:12')`);
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql(body.username);
      updatedUser.ProfilePicture.should.eql(body.profilePicture);
    });
    it('should not update userProfile without username field', async () => {
      const body = {
        profilePicture: 'newProfilePicture',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError username: expected string but received undefined');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql('user1');
      updatedUser.ProfilePicture.should.eql('profilePicture');
    });
    it('should not update userProfile without profilePicture field', async () => {
      const body = {
        username: 'newUsername',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError profilPicture: expected string but received undefined');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql('user1');
      updatedUser.ProfilePicture.should.eql('profilePicture');
    });
    it('should not update userProfile with unknown field', async () => {
      const body = {
        username: 'newUsername',
        profilePicture: 'newProfilePicture',
        unknown: 'unknown',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql('user1');
      updatedUser.ProfilePicture.should.eql('profilePicture');
    });
    it('should not update userProfile if username is already used', async () => {
      const body = {
        username: 'newUsername',
        profilePicture: 'newProfilePicture',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');
      await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'newUsername\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(409);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Username already used');

      const userProfiles = await sql.query('SELECT * FROM UserProfiles');
      const updatedUser = userProfiles[0];
      updatedUser.Username.should.eql('user1');
      updatedUser.ProfilePicture.should.eql('profilePicture');
    });
    it('should not update userProfile if username is not alphanumeric', async () => {
      const body = {
        username: 'newUsername[]',
        profilePicture: 'newProfilePicture',
      };
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .patch('/api/me')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Username must only contain numbers or letters');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql('user1');
      updatedUser.ProfilePicture.should.eql('profilePicture');
    });
    it('should not update userProfile without jwt', async () => {
      const body = {
        username: 'newUsername',
        profilePicture: 'newProfilePicture',
      };
      await sql.query('INSERT INTO UserProfiles (Username, Email, ProfilePicture, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'profilePicture\', \'2020-12-12 12:12:12\')');

      const res = await chai.request(server)
        .patch('/api/me')
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');

      const [updatedUser] = await sql.query('SELECT * FROM UserProfiles');
      updatedUser.Username.should.eql('user1');
      updatedUser.ProfilePicture.should.eql('profilePicture');
    });
  });
});
