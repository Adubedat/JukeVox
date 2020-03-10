/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import argon2 from 'argon2';

import sql from '../../src/helpers/database';

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

  describe('POST /login', () => {
    it('should successfully login and return jwt', async () => {
      const body = {
        email: 'test@test.test',
        password: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query(`INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('user1', '${body.email}', '2020-12-12 12:12:12')`);
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmed) VALUES (${user1.insertId}, '${body.email}', '${hash}', true)`);
      const res = await chai.request(server)
        .post('/login')
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('jwt');
    });
    it('should not successfully login without password', async () => {
      const body = {
        email: 'test@test.test',
      };
      const hash = await argon2.hash('aaaaaaaaaa');
      const user1 = await sql.query(`INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('user1', '${body.email}', '2020-12-12 12:12:12')`);
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmed) VALUES (${user1.insertId}, '${body.email}', '${hash}', true)`);
      const res = await chai.request(server)
        .post('/login')
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError password: expected string but received undefined');
    });
    it('should not successfully login without email', async () => {
      const body = {
        password: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmed) VALUES (${user1.insertId}, 'test@test.test', '${hash}', true)`);
      const res = await chai.request(server)
        .post('/login')
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError email: expected string but received undefined');
    });
    it('should not successfully login with an invalid password', async () => {
      const body = {
        email: 'test@test.test',
        password: 'wrongPassword',
      };
      const hash = await argon2.hash('aaaaaaaaaa');
      const user1 = await sql.query(`INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('user1', '${body.email}', '2020-12-12 12:12:12')`);
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmed) VALUES (${user1.insertId}, '${body.email}', '${hash}', true)`);
      const res = await chai.request(server)
        .post('/login')
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Invalid password');
    });
    it('should not successfully login with an invalid email', async () => {
      const body = {
        email: 'wrongEmail',
        password: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmed) VALUES (${user1.insertId}, 'test@test.test', '${hash}', true)`);
      const res = await chai.request(server)
        .post('/login')
        .send(body);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No account found for this email');
    });
    it('should not successfully login with an unknown field', async () => {
      const body = {
        email: 'test@test.test',
        password: 'aaaaaaaaaa',
        unknown: 'unknown',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query(`INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('user1', '${body.email}', '2020-12-12 12:12:12')`);
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmed) VALUES (${user1.insertId}, '${body.email}', '${hash}', true)`);
      const res = await chai.request(server)
        .post('/login')
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Unknown field: unknown');
    });
    it('should not successfully login if email is not confirmed', async () => {
      const body = {
        email: 'test@test.test',
        password: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.password);
      const user1 = await sql.query(`INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('user1', '${body.email}', '2020-12-12 12:12:12')`);
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, '${body.email}', '${hash}')`);
      const res = await chai.request(server)
        .post('/login')
        .send(body);

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Email not confirmed');
    });
  });
});
