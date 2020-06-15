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

  describe('/POST users', () => {
    it('should not POST a user without a password field', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const res = await chai.request(server)
        .post('/users')
        .send(user);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('TypeError password: expected string but received undefined');

      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(0);
      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user without a username field', async () => {
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
      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user with a username field too long', async () => {
      const user = {
        username: 'adnmelodsdfsadfsdfadfsdafplsd',
        email: 'daniel@mail.com',
        password: 'abcdefghijk',
      };
      const res = await chai.request(server)
        .post('/users')
        .send(user);

      res.should.have.status(500);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Internal server error');
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(0);

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user without an email field', async () => {
      const user = {
        username: 'Daniel',
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
      res.body.message.should.eql('TypeError email: expected string but received undefined');
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(0);

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user with an invalid username field', async () => {
      const user = {
        username: 'Daniel&Daniel',
        password: 'abcdefghijk',
        email: 'daniel@mail.com',
      };

      const res = await chai.request(server)
        .post('/users')
        .send(user);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Username must only contain numbers or letters');
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(0);

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user with an invalid password field', async () => {
      const user = {
        username: 'Daniel',
        password: 'abc',
        email: 'daniel@mail.com',
      };

      const res = await chai.request(server)
        .post('/users')
        .send(user);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Your password must have at least 10 characters');
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(0);

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user with an invalid email field', async () => {
      const user = {
        username: 'Daniel',
        password: 'abcdefghijk',
        email: 'daniel',
      };
      const res = await chai.request(server)
        .post('/users')
        .send(user);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Email not correctly formatted');
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(0);

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user with an existing username', async () => {
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]).catch((err) => logger.error(err));

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
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(1);

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    it('should not POST a user with an existing email', async () => {
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]).catch((err) => logger.error(err));

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
      const users = await sql.query('SELECT * FROM UserProfiles');
      users.should.have.lengthOf(1);

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(0);
    });

    // TODO: See if we can secure edge case (should never happen in practice)
    // it('should not POST a user with an existing email in userAccounts', async () => {
    //   const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    //   const values = [['Daniel', 'fakeemail@mail.com', moment().format(DATETIME_FORMAT)]];
    //   const user1 = await sql.query(query, [values]).catch((err) => logger.error(err));
    //   const query2 = 'INSERT INTO UserAccounts (UserProfileId, Email) VALUES ?';
    //   const values2 = [[user1.insertId, 'daniel@mail.com']];
    //   await sql.query(query2, [values2]).catch((err) => logger.error(err));

    //   const user = {
    //     username: 'Daniel2',
    //     password: 'abcdefghijk',
    //     email: 'daniel@mail.com',
    //   };

    //   const res = await chai.request(server).post('/users').send(user);
    //   res.should.have.status(500);
    //   res.body.should.be.a('object');
    //   res.body.should.have.property('status').eql('error');
    //   res.body.should.have.property('statusCode');
    //   res.body.should.have.property('message');
    //   res.body.message.should.eql('Internal server error');
    //   const users = await sql.query('SELECT * FROM UserProfiles');
    //   users.should.have.lengthOf(1);
    // });

    it('should POST a user', async () => {
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

      const useraccounts = await sql.query('SELECT * FROM UserAccounts');
      useraccounts.should.have.lengthOf(1);
      useraccounts[0].Email.should.be.eql('arthur.dubedat@gmail.com');
    });
  });
});
