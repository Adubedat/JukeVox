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

  describe('GET resetPassword/:token', () => {
    it('should rsuccess with valid token', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString')`);

      const res = await chai.request(server)
        .get('/resetPassword/confirmationString');

      res.should.have.status(200);
    });
    it('should FAIL with invalid token', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, ConfirmationToken) VALUES (${user1.insertId}, 'test@test.test', 'confirmationString')`);

      const res = await chai.request(server)
        .get('/resetPassword/invalidConfirmationString');

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Token does not exist');
    });
  });
});
