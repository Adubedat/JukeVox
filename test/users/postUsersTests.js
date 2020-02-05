/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
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

  describe('/POST users', () => {
    it('should not POST a user without a password field', (done) => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('No password was supplied');
          done();
        });
    });

    it('should not POST a user without a username field', (done) => {
      const user = {
        email: 'daniel@mail.com',
        password: 'abcdefghijk',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('No username was supplied');
          done();
        });
    });

    it('should not POST a user without an email field', (done) => {
      const user = {
        username: 'Daniel',
        password: 'abcdefghijk',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('No email was supplied');
          done();
        });
    });

    it('should not POST a user with an invalid username field', (done) => {
      const user = {
        username: 'Daniel&Daniel',
        password: 'abcdefghijk',
        email: 'daniel@mail.com',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('Username must only contain numbers or letters');
          done();
        });
    });

    it('should not POST a user with an invalid password field', (done) => {
      const user = {
        username: 'Daniel',
        password: 'abc',
        email: 'daniel@mail.com',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('Your password must have at least 10 characters');
          done();
        });
    });

    it('should not POST a user with an invalid email field', (done) => {
      const user = {
        username: 'Daniel',
        password: 'abcdefghijk',
        email: 'daniel',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('Email not correctly formatted');
          done();
        });
    });

    it('should not POST a user with an existing username', async () => {
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]).catch((err) => console.log(err));

      const user = {
        username: 'Daniel',
        password: 'abcdefghijk',
        email: 'daniel2@mail.com',
      };

      const res = await chai.request(server).post('/users').send(user);
      res.should.have.status(409);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('There already is an account with this username');
    });

    // TODO: Add two extra test to see if existing email still passes when email exists in useraccounts or provideraccounts
    it('should not POST a user with an existing email', async () => {
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]).catch((err) => console.log(err));

      const user = {
        username: 'Daniel2',
        password: 'abcdefghijk',
        email: 'daniel@mail.com',
      };

      const res = await chai.request(server).post('/users').send(user);
      res.should.have.status(409);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('There already is an account with this email');
    });

    // TODO: Actually check that a user was added to the DB and UserAccount was made
    it('should POST a user', (done) => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
        password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('message').eql('User created. Please check your mail!');
          done();
        });
    });
  });
});
