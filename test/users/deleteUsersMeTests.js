/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import crypto from 'crypto';
import DATETIME_FORMAT from '../../src/server/constants';

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

    describe('/DELETE /users/me', () => {
        it('should DELETE personnal user account', async () => {
          const body = {
            password: 'aaaaaaaaaa',
          };
          const username = 'testUser';
          const result = await sql.query(`INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('${username}', 'test@test.test', '2020-12-12 12:12:12')`);
          await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email) VALUES (${result.insertId}, 'test@test.test')`);
          const res = await chai.request(server)
            .delete('/users/me')
            .send(body);
    
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          const userAccounts = await sql.query('SELECT * FROM UserAccounts');
          userAccounts.should.have.lengthOf(0);
        });
      });

    });