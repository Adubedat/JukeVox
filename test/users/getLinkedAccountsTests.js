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

describe('Users', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('GET /api/me/linkedAccounts', () => {
    it('should get provider accounts with valid token', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId, AccessToken) VALUES (${user1.insertId}, 'Facebook', 12342345, 'FBToken')`);
      await sql.query(`INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId, AccessToken) VALUES (${user1.insertId}, 'Deezer', 12342345, 'DeezerToken')`);

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .get('/api/me/linkedAccounts')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.have.all.keys('message', 'accounts', 'statusCode');
      res.body.accounts.should.have.lengthOf(2);
      res.body.accounts[0].should.have.all.keys('UserProfileId', 'Provider', 'ProviderId', 'AccessToken');
      res.body.accounts[0].Provider.should.eql('Facebook');
      res.body.accounts[1].Provider.should.eql('Deezer');
    });
    it('should throw 404 not found with no linked accounts', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');

      const jwt = generateJwt(user1.insertId);

      const res = await chai.request(server)
        .get('/api/me/linkedAccounts')
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No account found for this email');
    });
    it('should throw 401 without jwt', async () => {
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test,test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId, AccessToken) VALUES (${user1.insertId}, 'Facebook', 12342345, 'FBToken')`);
      await sql.query(`INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId, AccessToken) VALUES (${user1.insertId}, 'Deezer', 12342345, 'DeezerToken')`);

      const res = await chai.request(server)
        .get('/api/me/linkedAccounts');

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');
    });
  });
});
