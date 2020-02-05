/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import argon2 from 'argon2';
import { generateJwt } from '../../src/server/controller/userController';

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

  describe('PUT /api/users/me/password', () => {
    it('should update user password with valid old and new password', async () => {
      const body = {
        oldPassword: 'aaaaaaaaaa',
        newPassword: 'bbbbbbbbbb',
      };
      const hash = await argon2.hash(body.oldPassword);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      const jwt = generateJwt(user1.insertId);

      const checkOldPwBefore = await argon2.verify(hash, body.oldPassword);
      const checkNewPwBefore = await argon2.verify(hash, body.newPassword);
      checkOldPwBefore.should.eql(true);
      checkNewPwBefore.should.eql(false);

      const res = await chai.request(server)
        .put('/api/users/me/password')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');

      const [updatedUserAccount] = await sql.query('SELECT * FROM userAccount');
      const checkOldPwAfter = await argon2.verify(updatedUserAccount.Password, body.oldPassword);
      const checkNewPwAfter = await argon2.verify(updatedUserAccount.Password, body.newPassword);
      checkOldPwAfter.should.eql(false);
      checkNewPwAfter.should.eql(true);
    });
    it('should not update user password without jwt', async () => {
      const body = {
        oldPassword: 'aaaaaaaaaa',
        newPassword: 'bbbbbbbbbb',
      };
      const hash = await argon2.hash(body.oldPassword);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);

      const checkOldPwBefore = await argon2.verify(hash, body.oldPassword);
      const checkNewPwBefore = await argon2.verify(hash, body.newPassword);
      checkOldPwBefore.should.eql(true);
      checkNewPwBefore.should.eql(false);

      const res = await chai.request(server)
        .put('/api/users/me/password')
        .send(body);

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Authorization token is missing');

      const [updatedUserAccount] = await sql.query('SELECT * FROM userAccount');
      const checkOldPwAfter = await argon2.verify(updatedUserAccount.Password, body.oldPassword);
      const checkNewPwAfter = await argon2.verify(updatedUserAccount.Password, body.newPassword);
      checkOldPwAfter.should.eql(true);
      checkNewPwAfter.should.eql(false);
    });
    it('should not update user password without oldPassword', async () => {
      const oldPassword = 'aaaaaaaaaa';
      const body = {
        newPassword: 'bbbbbbbbbb',
      };
      const hash = await argon2.hash(oldPassword);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      const jwt = generateJwt(user1.insertId);

      const checkOldPwBefore = await argon2.verify(hash, oldPassword);
      const checkNewPwBefore = await argon2.verify(hash, body.newPassword);
      checkOldPwBefore.should.eql(true);
      checkNewPwBefore.should.eql(false);

      const res = await chai.request(server)
        .put('/api/users/me/password')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Missing field in body: oldPassword');

      const [updatedUserAccount] = await sql.query('SELECT * FROM userAccount');
      const checkOldPwAfter = await argon2.verify(updatedUserAccount.Password, oldPassword);
      const checkNewPwAfter = await argon2.verify(updatedUserAccount.Password, body.newPassword);
      checkOldPwAfter.should.eql(true);
      checkNewPwAfter.should.eql(false);
    });
    it('should not update user password without newPassword', async () => {
      const newPassword = 'bbbbbbbbbb';
      const body = {
        oldPassword: 'aaaaaaaaaa',
      };
      const hash = await argon2.hash(body.oldPassword);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      const jwt = generateJwt(user1.insertId);

      const checkOldPwBefore = await argon2.verify(hash, body.oldPassword);
      const checkNewPwBefore = await argon2.verify(hash, newPassword);
      checkOldPwBefore.should.eql(true);
      checkNewPwBefore.should.eql(false);

      const res = await chai.request(server)
        .put('/api/users/me/password')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Missing field in body: newPassword');

      const [updatedUserAccount] = await sql.query('SELECT * FROM userAccount');
      const checkOldPwAfter = await argon2.verify(updatedUserAccount.Password, body.oldPassword);
      const checkNewPwAfter = await argon2.verify(updatedUserAccount.Password, newPassword);
      checkOldPwAfter.should.eql(true);
      checkNewPwAfter.should.eql(false);
    });
    it('should not update user password with a wrong old password', async () => {
      const oldPassword = 'aaaaaaaaaa';
      const body = {
        oldPassword: 'wrongPassword',
        newPassword: 'bbbbbbbbbb',
      };
      const hash = await argon2.hash(oldPassword);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      const jwt = generateJwt(user1.insertId);

      const checkOldPwBefore = await argon2.verify(hash, oldPassword);
      const checkNewPwBefore = await argon2.verify(hash, body.newPassword);
      checkOldPwBefore.should.eql(true);
      checkNewPwBefore.should.eql(false);

      const res = await chai.request(server)
        .put('/api/users/me/password')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Invalid oldPassword');

      const [updatedUserAccount] = await sql.query('SELECT * FROM userAccount');
      const checkOldPwAfter = await argon2.verify(updatedUserAccount.Password, oldPassword);
      const checkNewPwAfter = await argon2.verify(updatedUserAccount.Password, body.newPassword);
      checkOldPwAfter.should.eql(true);
      checkNewPwAfter.should.eql(false);
    });
    it('should not update user password with a wrong new password', async () => {
      const body = {
        oldPassword: 'wrongPassword',
        newPassword: 'invalid',
      };
      const hash = await argon2.hash(body.oldPassword);
      const user1 = await sql.query('INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES (\'user1\', \'test@test.test\', \'2020-12-12 12:12:12\')');
      await sql.query(`INSERT INTO UserAccounts (UserProfileId, Email, Password) VALUES (${user1.insertId}, 'test@test.test', '${hash}')`);
      const jwt = generateJwt(user1.insertId);

      const checkOldPwBefore = await argon2.verify(hash, body.oldPassword);
      const checkNewPwBefore = await argon2.verify(hash, body.newPassword);
      checkOldPwBefore.should.eql(true);
      checkNewPwBefore.should.eql(false);

      const res = await chai.request(server)
        .put('/api/users/me/password')
        .set({ Authorization: `Bearer ${jwt}` })
        .send(body);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Your password must have at least 10 characters');

      const [updatedUserAccount] = await sql.query('SELECT * FROM userAccount');
      const checkOldPwAfter = await argon2.verify(updatedUserAccount.Password, body.oldPassword);
      const checkNewPwAfter = await argon2.verify(updatedUserAccount.Password, body.newPassword);
      checkOldPwAfter.should.eql(true);
      checkNewPwAfter.should.eql(false);
    });
  });
});
