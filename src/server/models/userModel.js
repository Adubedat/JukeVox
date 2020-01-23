import moment from 'moment';
import crypto from 'crypto';
import argon2 from 'argon2';
import sql from '../../../db';
import DATETIME_FORMAT from '../constants';

const User = function () {

};

User.createUserProfile = function createUserProfile(username, email) {
  return new Promise(((resolve, reject) => {
    const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) \
    VALUES ?';
    const values = [[username, email, moment().format(DATETIME_FORMAT)]];

    sql.query(query, [values], (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(res);
        resolve(res);
      }
    });
  }));
};

User.createUserAccount = async function createUserAccount(userProfileId, email, password) {
  const hash = await argon2.hash(password).catch((err) => {
    console.log(`We have a hashing error: ${err}`);
    throw new Error(err);
  });
  console.log(hash);

  return new Promise((resolve, reject) => {
    const expirationDate = moment().add(3, 'd').format(DATETIME_FORMAT);

    // TODO: Verify function is secure if we're using the same for authenticating the user
    const token = crypto.randomBytes(24).toString('hex');
    console.log(token);

    // TODO: update dbdiagram (emailconfirmationString)
    const query = 'INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmationString, AccountExpiration) \
    VALUES ?';
    const values = [[userProfileId, email, hash, token, expirationDate]];

    sql.query(query, [values], (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(res);
        res.emailConfirmationString = token;
        resolve(res);
      }
    });
  });
};

User.getUserProfile = function getUserProfile(filters, values) {
  return new Promise(((resolve, reject) => {
    let query = 'SELECT * FROM UserProfiles WHERE 1 = 1';
    filters.forEach((filter) => {
      query += ` AND ${filter} = ?`;
    });
    query += ';';

    sql.query(query, values, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }));
};

User.getUserAccountById = function getUserAccountById(id) {
  return new Promise(((resolve, reject) => {
    const query = 'SELECT * FROM UserAccounts WHERE UserProfileId = ?';
    sql.query(query, id, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }));
};

User.getProviderAccountsById = function getProviderAccountsById(id) {
  return new Promise(((resolve, reject) => {
    const query = 'SELECT * FROM ProviderAccounts WHERE UserProfileId = ?';
    sql.query(query, id, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }));
};

User.getUserByEmailToken = function getUserByEmailToken(token) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM UserAccounts WHERE EmailConfirmationString = ?';
    sql.query(query, token, (err, res) => {
      if (err) {
        console.log('There is an error');
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

export default User;
