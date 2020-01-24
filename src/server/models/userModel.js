import moment from 'moment';
import sql from '../../../db';
import DATETIME_FORMAT from '../constants';
import { ErrorResponseHandler } from '../../helpers/error';

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

User.createUserAccount = function createUserAccount(userProfileId, email, password, token) {
  return new Promise((resolve, reject) => {
    const expirationDate = moment().add(3, 'd').format(DATETIME_FORMAT);

    // TODO: update dbdiagram (emailconfirmationString)
    const query = 'INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmationString, AccountExpiration) \
    VALUES ?';
    const values = [[userProfileId, email, password, token, expirationDate]];

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

User.getUserAccount = function getUserAccount(filters, values) {
  return new Promise(((resolve, reject) => {
    let query = 'SELECT * FROM UserAccounts WHERE 1 = 1';
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

User.confirmUserEmail = function confirmUserEmail(token) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE UserAccounts SET EmailConfirmed = true, EmailConfirmationString = NULL WHERE EmailConfirmationString = ?';
    sql.query(query, token, (err, res) => {
      if (err) {
        console.log('Error verifying user');
        console.log(err);
        reject(new ErrorResponseHandler(500, 'Internal server Error'));
      } else {
        resolve(res);
      }
    });
  });
};

export default User;
