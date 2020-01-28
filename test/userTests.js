/* eslint-env node, mocha */

import 'core-js/stable';
import 'regenerator-runtime/runtime';

const chai = require('chai');
const chaiHttp = require('chai-http');
// const user = require('../src/server/routes/userRoute');
const server = require('../server');

const should = chai.should();

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach((done) => {
    // TODO: Before each test, clear the DB
    done();
  });

  /*
   * Test the GET route
  */

  describe('/GET users', () => {
    it('should GET all the users', (done) => {
      chai.request(server)
        .get('/users/search')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('data');
          done();
        });
    });
  });

  /*
  * Test the /POST route
  */

  describe('/POST user', () => {
    it('should not POST a user without a password field', (done) => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          done();
        });
    });

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
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message').eql('User successfully added!');
          done();
        });
    });
  });

  /*
  * Test the /GET/users/:email/accounts route
  */
  describe('/GET/users/:email/accounts', () => {
    it('should GET a user accounts by a given email address', (done) => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
        password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      };
      // TODO add user to db and in callback
      chai.request(server)
        .get(`/users/${user.email}/accounts`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          // TODO: Add tests to check just UserAccount is returned
          done();
        });
    });
  });
});
