/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import sql from '../db';
import moment from 'moment';
import DATETIME_FORMAT from '../src/server/constants';


const chai = require('chai');
const chaiHttp = require('chai-http');
// const user = require('../src/server/routes/userRoute');
const server = require('../server');

const should = chai.should();

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach((done) => {
    let query = 'DELETE FROM UserAccounts;';
    sql.query(query, (err, res) => {
      if (err) {
        console.log(err);
      }
    });

    query = 'DELETE FROM ProviderAccounts;';
    sql.query(query, (err, res) => {
      if (err) {
        console.log(err);
      }
    });

    query = 'DELETE FROM UserProfiles;';
    sql.query(query, (err, res) => {
      if (err) {
        console.log(err);
      }
    });

    done();
  });

  /*
   * Test the GET route
  */

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
          done();
        });
    });


    it('should GET all the users', (done) => {
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
      sql.query(query, [values], (err, res) => {
        if (err) {
          console.log(err);
        } else {
          chai.request(server)
          .get('/users')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.should.have.property('data');
            res.body.data.should.be.a('array')
            res.body.data.length.should.be.eql(1);
            res.body.data[0].should.have.property('Id');
            res.body.data[0].should.have.property('Username');
            res.body.data[0].should.have.property('Email');
            res.body.data[0].should.have.property('ProfilePicture');
            console.log(res.body.data[0]);
            res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture');
            done();
          });
        }
      })

      //TODO: GET /users with a username as query
      //TODO: GET /users with a wrong username as query
      //TODO: GET /users with an email address as query
      //TODO: GET /users with a wrong email address as query
      //TODO: GET /users with BOTH a username and email address as query
      //TODO: GET /users with BOTH a wrong username and wrong email address as query
      //TODO: GET /users with BOTH a right username and wrong email address as query
      //TODO: GET /users with BOTH a wrong username and right email address as query
      //TODO: GET /users with a non existant query

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
