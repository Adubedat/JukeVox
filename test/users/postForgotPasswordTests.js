/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';
import logger from '../../src/helpers/logger';

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

  async function addUserProfile(email) {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [['Daniel', email, moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery,
      [userProfileValues]).catch((err) => logger.error(err));
    return userProfile;
  }

  async function addUserAccount(id, email, emailConfirmed) {
    const password = 'oldPassword';

    const userAccountQuery = 'INSERT INTO UserAccounts (UserProfileId, Email, Password, \
      EmailConfirmed) \
    VALUES ?';
    const userAccountValues = [[id, email, password, emailConfirmed]];
    const userAccount = await sql.query(userAccountQuery,
      [userAccountValues]).catch((err) => logger.error(err));

    return userAccount;
  }

  describe('/POST /forgotPassword', () => {
    it('should sucess with valid params', async () => {
      const email = 'test@test.test';
      const user1 = await addUserProfile(email);
      await addUserAccount(user1.insertId, email, true);

      const [userAccountBefore] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountBefore.ConfirmationToken).to.equal(null);
      expect(userAccountBefore.TokenExpiration).to.equal(null);

      const body = {
        email,
      };
      const res = await chai.request(server)
        .post('/forgotPassword')
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Reset password mail sent');

      const [userAccountAfter] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountAfter.ConfirmationToken).to.exist; //eslint-disable-line
      expect(userAccountAfter.TokenExpiration).to.exist; //eslint-disable-line
    });

    it('should fail if userAccount is not confirmed', async () => {
      const email = 'test@test.test';
      const user1 = await addUserProfile(email);
      await addUserAccount(user1.insertId, email, false);

      const [userAccountBefore] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountBefore.ConfirmationToken).to.equal(null);
      expect(userAccountBefore.TokenExpiration).to.equal(null);

      const body = {
        email,
      };
      const res = await chai.request(server)
        .post('/forgotPassword')
        .send(body);

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Your account is not confirmed');

      const [userAccountAfter] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountAfter.ConfirmationToken).to.equal(null);
      expect(userAccountAfter.TokenExpiration).to.equal(null);
    });

    it('should fail if email is not found', async () => {
      const email = 'test@test.test';
      const user1 = await addUserProfile(email);
      await addUserAccount(user1.insertId, email, true);

      const [userAccountBefore] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountBefore.ConfirmationToken).to.equal(null);
      expect(userAccountBefore.TokenExpiration).to.equal(null);

      const body = {
        email: 'false email',
      };
      const res = await chai.request(server)
        .post('/forgotPassword')
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No account found for this email');

      const [userAccountAfter] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountAfter.ConfirmationToken).to.equal(null);
      expect(userAccountAfter.TokenExpiration).to.equal(null);
    });

    it('should fail without email in body', async () => {
      const email = 'test@test.test';
      const user1 = await addUserProfile(email);
      await addUserAccount(user1.insertId, email, true);

      const [userAccountBefore] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountBefore.ConfirmationToken).to.equal(null);
      expect(userAccountBefore.TokenExpiration).to.equal(null);

      const res = await chai.request(server)
        .post('/forgotPassword');

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError email: expected string but received undefined');

      const [userAccountAfter] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountAfter.ConfirmationToken).to.equal(null);
      expect(userAccountAfter.TokenExpiration).to.equal(null);
    });

    it('should fail with an unknown parameter', async () => {
      const email = 'test@test.test';
      const user1 = await addUserProfile(email);
      await addUserAccount(user1.insertId, email, true);

      const [userAccountBefore] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountBefore.ConfirmationToken).to.equal(null);
      expect(userAccountBefore.TokenExpiration).to.equal(null);

      const body = {
        email,
        unknown: 'unknown',
      };
      const res = await chai.request(server)
        .post('/forgotPassword')
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');

      const [userAccountAfter] = await sql.query(`SELECT * FROM UserAccounts WHERE Email = '${email}'`);
      expect(userAccountAfter.ConfirmationToken).to.equal(null);
      expect(userAccountAfter.TokenExpiration).to.equal(null);
    });
  });
});
