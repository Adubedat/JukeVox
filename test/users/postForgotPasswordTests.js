/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';

import sql from '../../src/helpers/database';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();

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
      [userProfileValues]).catch((err) => console.log(err));
    return userProfile;
  }

  async function addUserAccount(id, email, emailConfirmed) {
    const password = 'oldPassword';
    const token = 'token';
    const expirationDate = moment().add(3, 'd').format(DATETIME_FORMAT);

    const userAccountQuery = 'INSERT INTO UserAccounts (UserProfileId, Email, Password, \
      ConfirmationToken, EmailConfirmed, TokenExpiration) \
    VALUES ?';
    const userAccountValues = [[id, email, password, token, emailConfirmed, expirationDate]];
    const userAccount = await sql.query(userAccountQuery,
      [userAccountValues]).catch((err) => console.log(err));

    return userAccount;
  }

  // TODO: In all of the 'should NOT POST' check that no user was actually added
  describe('/POST /forgotPassword', () => {
    it('should send mail with params', async () => {
      const email = 'test@test.test';
      const user1 = await addUserProfile(email);
      await addUserAccount(user1.insertId, email, true);

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
    });
  });
});
