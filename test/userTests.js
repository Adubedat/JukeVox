/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import crypto from 'crypto';
import DATETIME_FORMAT from '../src/server/constants';

import Database from '../src/helpers/database'

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');

const sql = new Database();

const should = chai.should();

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM UserAccounts;')
    await sql.query('DELETE FROM ProviderAccounts;')
    await sql.query('DELETE FROM UserProfiles;')
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
          res.body.message.should.eql('No user found');
          done();
        });
    });


    it('should GET all the users', async () => {
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]).catch((err) => console.log(err));
      const res = await chai.request(server)
      .get('/users');
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array')
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
    });


    it('should GET a user with a username as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({username: user.username});
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array')
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
      res.body.data[0].Username.should.eql(user.username);
    });

    it('should not GET a user with a non existant username as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({username: 'NonExistantUsername'});
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
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({email: user.email});
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array')
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
      res.body.data[0].Email.should.eql(user.email);
    });

    it('should not GET a user with a non existant email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({email: 'NonExistantEmail@mail.com'});
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
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({username: user.username, email: user.email});
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.eql('Users found');
      res.body.should.have.property('data');
      res.body.data.should.be.a('array')
      res.body.data.length.should.be.eql(1);
      res.body.data[0].should.have.all.keys('Id', 'Username', 'Email', 'ProfilePicture', 'CreatedAt');
      res.body.data[0].Email.should.eql(user.email);
    });

    it('should not GET a user with a wrong username and a wrong email as query', async () => {
      const user = {
        username: 'Daniel',
        email: 'daniel@mail.com',
      };
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({username: 'WrongUsername', email: 'WrongUsername@mail.com'});
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
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({username: user.username, email: 'WrongUsername@mail.com'});
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
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({username: 'WrongUsername', email: user.email});
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
      const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
      const values = [[user.username, user.email, moment().format(DATETIME_FORMAT)]];
      await sql.query(query, [values]);
      const res = await chai.request(server)
      .get('/users')
      .query({unknown: 'unknown'});
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
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
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('statusCode');
          res.body.should.have.property('message');
          res.body.message.should.eql('No password was supplied')
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
            res.body.message.should.eql('No username was supplied')
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
              res.body.message.should.eql('No email was supplied')
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
                res.body.message.should.eql('Username is invalid')
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
                res.body.message.should.eql('Password is too short')
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
                res.body.message.should.eql('Email is invalid')
                done();
              });
          });

          it('should not POST a user with an existing username', async () => {

            const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
            const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
            await sql.query(query, [values]).catch((err) => console.log(err));

            const user = {
              username: 'Daniel',
              password: 'abcdefghijk',
              email: 'daniel2@mail.com',
            };

            const res = await chai.request(server).post('/users').send(user);
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql('error');
            res.body.should.have.property('statusCode');
            res.body.should.have.property('message');
            res.body.message.should.eql('Username already exists')
          });

          //TODO: Add two extra test to see if existing email still passes when email exists in useraccounts or provideraccounts
          it('should not POST a user with an existing email', async () => {

            const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?'
            const values = [['Daniel', 'daniel@mail.com', moment().format(DATETIME_FORMAT)]];
            await sql.query(query, [values]).catch((err) => console.log(err));

            const user = {
              username: 'Daniel2',
              password: 'abcdefghijk',
              email: 'daniel@mail.com',
            };

            const res = await chai.request(server).post('/users').send(user);
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql('error');
            res.body.should.have.property('statusCode');
            res.body.should.have.property('message');
            res.body.message.should.eql('Email already exists')
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
  * Test the GET/users/:email/accounts route
  */
  describe('GET /users/:email/accounts', () => {

    async function addUserProfile(email) {
      const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
      const userProfileValues = [['Daniel', email, moment().format(DATETIME_FORMAT)]];
      const userProfile = await sql.query(userProfileQuery, [userProfileValues]).catch((err) => console.log(err));
      return userProfile;
    }
    
    async function addUserAccount(id, email) {
      const password = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const token = crypto.randomBytes(24).toString('hex');
      const expirationDate = moment().add(3, 'd').format(DATETIME_FORMAT);

      const userAccountQuery = 'INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmationString, AccountExpiration) \
      VALUES ?';
      const userAccountValues = [[id, email, password, token, expirationDate]]
      const userAccount = await sql.query(userAccountQuery, [userAccountValues]).catch((err) => console.log(err));

      return userAccount;
    }

    async function addProviderAccount(type, id) {

      const providerAccountQuery = 'INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId) \
      VALUES ?';
      const providerAccountValues = [[id, type, 'a']]
      const providerAccount = await sql.query(providerAccountQuery, [providerAccountValues]).catch((err) => console.log(err));

      return providerAccount;
    }

    it('should GET a only a classic user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addUserAccount(userProfile.insertId, email);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(1);
      res.body.accountTypes[0].should.be.eql('Classic');
    });

    it('should GET a only a google user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Google', userProfile.insertId);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(1);
      res.body.accountTypes[0].should.be.eql('Google');
    });

    it('should GET a only a google user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Google', userProfile.insertId);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(1);
      res.body.accountTypes[0].should.be.eql('Google');
    });

    it('should GET a only a facebook user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Facebook', userProfile.insertId);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(1);
      res.body.accountTypes[0].should.be.eql('Facebook');
    });

    it('should GET a only a deezer user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Deezer', userProfile.insertId);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(1);
      res.body.accountTypes[0].should.be.eql('Deezer');
    });

    it('should GET a deezer + google + facebook user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Deezer', userProfile.insertId);
      await addProviderAccount('Google', userProfile.insertId);
      await addProviderAccount('Facebook', userProfile.insertId);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(3);
      res.body.accountTypes[2].should.be.eql('Deezer');
      res.body.accountTypes[1].should.be.eql('Google');
      res.body.accountTypes[0].should.be.eql('Facebook');
    });

    it('should GET a classic and google user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Google', userProfile.insertId);
      await addUserAccount(userProfile.insertId, email);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(2);
      res.body.accountTypes[0].should.be.eql('Classic');
      res.body.accountTypes[1].should.be.eql('Google');
    });

    it('should GET a classic and google + deezer user account by a given email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Google', userProfile.insertId);
      await addProviderAccount('Deezer', userProfile.insertId);
      await addUserAccount(userProfile.insertId, email);

      const res = await chai.request(server).get(`/users/${email}/accounts`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Email matches these account types');  
      res.body.should.have.property('accountTypes');
      res.body.accountTypes.should.be.a('array');
      res.body.accountTypes.length.should.be.eql(3);
      res.body.accountTypes[0].should.be.eql('Classic');
      res.body.accountTypes[1].should.be.eql('Google');
      res.body.accountTypes[2].should.be.eql('Deezer');
    });

    it('should not GET a user account with an invalid email address', async () => {  
      const email = 'daniel@mail.com';    
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Google', userProfile.insertId);
      await addUserAccount(userProfile.insertId, email);

      const res = await chai.request(server).get(`/users/daniel/accounts`);

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Email invalid')
    });

    it('should not GET a user account with a non existant email address', async () => {  
      const email = 'daniel@mail.com';
      const unknown = 'unknown@mail.com';
      const userProfile = await addUserProfile(email);
      await addProviderAccount('Google', userProfile.insertId);
      await addUserAccount(userProfile.insertId, email);

      const res = await chai.request(server).get(`/users/${unknown}/accounts`);

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No account found for this email')
    });

    it('should not GET a user account with a non existant providerAccount or userAccount', async () => {  
      const email = 'daniel@mail.com';
      await addUserProfile(email);

      const res = await chai.request(server).get(`/users/${email}/accounts`);

      console.log(res.body);
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('status').eql('error');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No account found for this email')
    });

  });


});
