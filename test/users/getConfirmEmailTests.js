/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

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

  describe('GET confirmEmail/:token', () => {
    it('should activate account with valid token', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString')`);
      const [userAccount] = await sql.query('SELECT * FROM UserAccounts');
      userAccount.EmailConfirmed.should.eql(0);
      userAccount.ConfirmationToken.should.eql('confirmationString');
      const res = await chai.request(server)
        .get('/confirmEmail/confirmationString');
      res.should.have.status(200);
      const [userAccount2] = await sql.query('SELECT * FROM UserAccounts');
      userAccount2.EmailConfirmed.should.eql(1);
      expect(userAccount2.ConfirmationToken).to.equal(null);
      expect(userAccount2.TokenExpiration).to.equal(null);
    });
    it('should not activate account with invalid token', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString')`);
      const [userAccount] = await sql.query('SELECT * FROM UserAccounts');
      userAccount.EmailConfirmed.should.eql(0);
      userAccount.ConfirmationToken.should.eql('confirmationString');
      const res = await chai.request(server)
        .get('/confirmEmail/invalidConfirmationString');
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Token does not exist');
      const [userAccount2] = await sql.query('SELECT * FROM UserAccounts');
      userAccount2.EmailConfirmed.should.eql(0);
      expect(userAccount2.ConfirmationToken).to.equal('confirmationString');
    });
  });
});
