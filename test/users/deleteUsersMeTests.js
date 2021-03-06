/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import argon2 from 'argon2';
import sql from '../../src/helpers/database';
import { generateJwt } from '../../src/helpers/utils';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM Logs');
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM Logs');
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('/DELETE /api/me', () => {
    it('should DELETE personnal user account', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email) VALUES (${user1.insertId}, 'test@test.test')`);
      await sql.query(`INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId) VALUES (${user1.insertId}, 'Google', 'test')`);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/me')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      const userAccounts = await sql.query('SELECT * FROM UserAccounts');
      const providerAccounts = await sql.query('SELECT * FROM ProviderAccounts');
      const userProfile = await sql.query('SELECT * FROM UserProfiles');
      userAccounts.should.have.lengthOf(0);
      providerAccounts.should.have.lengthOf(0);
      userProfile.should.have.lengthOf(1);
      expect(userProfile[0].Username).to.equal(null);
      expect(userProfile[0].Email).to.equal(null);
      expect(userProfile[0].ProfilePicture).to.equal(null);
    });
    it('should not DELETE user without jwt', async () => {
      const body = {
        password: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      const res = await chai.request(server)
        .delete('/api/me')
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');
      const userAccounts = await sql.query('SELECT * FROM UserAccounts');
      userAccounts.should.have.lengthOf(1);
    });
    it('should not DELETE user with an invalid jwt', async () => {
      const body = {
        password: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      let jwt = generateJwt(user1.insertId);
      jwt = jwt.substring(0, jwt.length - 1);
      const res = await chai.request(server)
        .delete('/api/me')
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
    it('jwt should not be valid anymore after deleting a user account', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email) VALUES (${user1.insertId}, 'test@test.test')`);
      await sql.query(`INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId) VALUES (${user1.insertId}, 'Google', 'test')`);

      const jwt = generateJwt(user1.insertId);
      const res = await chai.request(server)
        .delete('/api/me')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const res2 = await chai.request(server)
        .delete('/api/me')
        .set({ Authorization: `Bearer ${jwt}` });

      res2.should.have.status(401);
      res2.body.should.be.a('object');
      res2.body.should.have.property('statusCode');
      res2.body.should.have.property('message');
      res2.body.message.should.eql('Invalid authorization token');
    });
  });
});
