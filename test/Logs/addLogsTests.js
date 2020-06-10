/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import argon2 from 'argon2';
import moment from 'moment';
import {
  ACCOUNT_CREATED, ACCOUNT_CONFIRMED, ACCOUNT_DELETED, EVENT_CREATED,
} from '../../src/server/models/logsModel';
import { generateJwt } from '../../src/helpers/utils';
import DATETIME_FORMAT from '../../src/server/constants';

import sql from '../../src/helpers/database';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();
const { expect } = chai;

const sleep = (m) => new Promise((r) => setTimeout(r, m));

chai.use(chaiHttp);

describe('Logs', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM Logs;');
    await sql.query('DELETE FROM EventGuests;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserAccounts');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM Logs;');
    await sql.query('DELETE FROM EventGuests;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserAccounts');
    await sql.query('DELETE FROM ProviderAccounts;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('POST /users', () => {
    it('should create a log on success', async () => {
      const user = {
        username: 'Daniel',
        email: 'arthur.dubedat@gmail.com',
        password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      };

      const res = await chai.request(server)
        .post('/users')
        .send(user);

      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('User created. Please check your mail!');
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(1);
      users[0].Username.should.be.eql('Daniel');

      await sleep(100);
      const logs = await sql.query('SELECT * FROM Logs');

      logs.should.have.lengthOf(1);
      logs[0].EventType.should.eql(ACCOUNT_CREATED.toString());
      logs[0].UserId.should.eql(users[0].Id);
    });
    it('should not create a log on failure', async () => {
      const user = {
        email: 'daniel@mail.com',
        password: 'abcdefghijk',
      };
      const res = await chai.request(server)
        .post('/users')
        .send(user);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError username: expected string but received undefined');
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(0);

      await sleep(100);

      const logs = await sql.query('SELECT * FROM Logs');
      logs.should.have.lengthOf(0);
    });
  });

  describe('GET confirmEmail/:token', () => {
    it('should create a log on success', async () => {
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

      await sleep(100);

      const [logs] = await sql.query('SELECT * FROM Logs');
      logs.EventType.should.eql(ACCOUNT_CONFIRMED.toString());
      logs.UserId.should.eql(userAccount2.UserProfileId);
    });
    it('should not create a log on failure', async () => {
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

      await sleep(100);

      const logs = await sql.query('SELECT * FROM Logs');
      logs.should.have.lengthOf(0);
    });
  });

  describe('/DELETE /api/me', () => {
    it('should create a log on success', async () => {
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

      await sleep(100);

      const [logs] = await sql.query('SELECT * FROM Logs');
      logs.EventType.should.eql(ACCOUNT_DELETED.toString());
      logs.UserId.should.eql(userProfile[0].Id);
    });
    it('should not create a log on failure', async () => {
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

      await sleep(100);

      const logs = await sql.query('SELECT * FROM Logs');
      logs.should.have.lengthOf(0);
    });
  });

  describe('/POST /events', () => {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    it('should create a log on success', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        location: '46 tests street',
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
        restrictVotingToEventHours: true,
      };

      const user = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      const jwt = generateJwt(user.insertId);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');

      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql('Event successfully created!');

      await sleep(100);

      const [logs] = await sql.query('SELECT * FROM Logs');
      logs.EventType.should.eql(EVENT_CREATED.toString());
      logs.UserId.should.eql(user.insertId);
    });
    it('should not create a log on failure', async () => {
      const body = {
        name: 'House warming',
        description: 'All come over on wednesday for our housewarming!',
        startDate,
        endDate,
        latitude: 48.8915482,
        longitude: 2.3170656,
        streamerDevice: 'abcd',
        isPrivate: true,
        eventPicture: 'defaultPicture1',
      };

      const jwt = generateJwt(-1);

      const res = await chai.request(server)
        .post('/api/events')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Invalid authorization token');
      const createdEvents = await sql.query('SELECT * FROM Events');
      createdEvents.should.have.lengthOf(0);

      await sleep(100);

      const logs = await sql.query('SELECT * FROM Logs');
      logs.should.have.lengthOf(0);
    });
  });
});
