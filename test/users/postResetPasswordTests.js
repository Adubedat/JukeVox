/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import argon2 from 'argon2';

import sql from '../../src/helpers/database';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM UserAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('POST resetPassword/:token', () => {
    it('should update password with valid params', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken, TokenExpiration) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString', '2020-12-12 12:12:12')`);

      const body = {
        newPassword: 'newPassword',
      };
      const res = await chai.request(server)
        .post('/resetPassword/confirmationString')
        .send(body);

      res.should.have.status(200);

      const [userAccount] = await sql.query('SELECT * FROM UserAccounts');
      expect(userAccount.ConfirmationToken).to.equal(null);
      expect(userAccount.TokenExpiration).to.equal(null);
      const checkNewPwAfter = await argon2.verify(userAccount.Password, body.newPassword);
      checkNewPwAfter.should.eql(true);
    });
    it('should FAIL with invalid token', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken, TokenExpiration) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString', '2020-12-12 12:12:12')`);

      const body = {
        newPassword: 'newPassword',
      };
      const res = await chai.request(server)
        .post('/resetPassword/invalidConfirmationString')
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Token does not exist');

      const [userAccount] = await sql.query('SELECT * FROM UserAccounts');
      expect(userAccount.ConfirmationToken).to.equal('confirmationString');
      expect(userAccount.TokenExpiration).to.exist; // eslint-disable-line
      expect(userAccount.Password).to.equal(null);
    });
    it('should FAIL with too short newPassword', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken, TokenExpiration) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString', '2020-12-12 12:12:12')`);

      const body = {
        newPassword: 'tooShort',
      };
      const res = await chai.request(server)
        .post('/resetPassword/confirmationString')
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Your password must have at least 10 characters');

      const [userAccount] = await sql.query('SELECT * FROM UserAccounts');
      expect(userAccount.ConfirmationToken).to.equal('confirmationString');
      expect(userAccount.TokenExpiration).to.exist; // eslint-disable-line
      expect(userAccount.Password).to.equal(null);
    });
    it('should FAIL without newPassword', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken, TokenExpiration) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString', '2020-12-12 12:12:12')`);

      const res = await chai.request(server)
        .post('/resetPassword/confirmationString');

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError newPassword: expected string but received undefined');

      const [userAccount] = await sql.query('SELECT * FROM UserAccounts');
      expect(userAccount.ConfirmationToken).to.equal('confirmationString');
      expect(userAccount.TokenExpiration).to.exist; // eslint-disable-line
      expect(userAccount.Password).to.equal(null);
    });
    it('should FAIL with an unknown field', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken, TokenExpiration) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString', '2020-12-12 12:12:12')`);

      const body = {
        newPassword: 'newPassword',
        unknown: 'unknown',
      };
      const res = await chai.request(server)
        .post('/resetPassword/confirmationString')
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');

      const [userAccount] = await sql.query('SELECT * FROM UserAccounts');
      expect(userAccount.ConfirmationToken).to.equal('confirmationString');
      expect(userAccount.TokenExpiration).to.exist; // eslint-disable-line
      expect(userAccount.Password).to.equal(null);
    });
  });
});
