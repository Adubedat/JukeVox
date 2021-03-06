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
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM UserProfiles;');
  });

  describe('/GET users', () => {
    it('should not GET all the users if the database is empty', (done) => {
      chai.request(server)
        .get('/users')
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('No user found');
          done();
        });
    });


    it('should GET all the users', async () => {
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]).catch((err) => logger.error(err));
      const res = await chai.request(server)
        .get('/users');
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
    });


    it('should GET a user with a username as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ username: user.username });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
      res.body.data[0].Username.should.eql(user.username);
    });

    it('should not GET a user with a non existant username as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ username: 'NonExistantUsername' });
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No user found');
    });

    it('should GET a user with an email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ email: user.email });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
      res.body.data[0].Email.should.eql(user.email);
    });

    it('should not GET a user with a non existant email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ email: 'NonExistantEmail@mail.com' });
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No user found');
    });

    it('should GET a user with a username and an email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ username: user.username, email: user.email });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
      res.body.data[0].Email.should.eql(user.email);
    });

    it('should not GET a user with a wrong username and a wrong email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ username: 'WrongUsername', email: 'WrongUsername@mail.com' });
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No user found');
    });

    it('should not GET a user with a right username and a wrong email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ username: user.username, email: 'WrongUsername@mail.com' });
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No user found');
    });

    it('should not GET a user with a wrong username and a right email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ username: 'WrongUsername', email: user.email });
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No user found');
    });

    it('should not GET a user with an unknown query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
        .get('/users')
        .query({ unknown: 'unknown' });
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
    });
  });
});
