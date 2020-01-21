import moment from 'moment';
import sql from '../../../db';
import DATETIME_FORMAT from '../constants';

const User = function () {

};

User.createUserProfile = function createUserProfile(username, email) {
  return new Promise(((resolve, reject) => {
    const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) \
    VALUES ?';
    const values = [['adubedat', 'adubedat@student.42.fr', moment().format(DATETIME_FORMAT)]];

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

User.createUserAccount = function createUserAccount(userProfileId, email, password) {
  return new Promise(((resolve, reject) => {
    const query = 'INSERT INTO UserAccounts (Username, Email, CreatedAt) \
    VALUES ?';
    const values = [['adubedat', 'adubedat@student.42.fr', moment().format(DATETIME_FORMAT)]];

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

User.getUserProfile = function getUserProfile(filters, values) {
  return new Promise(((resolve, reject) => {
    let query = 'SELECT * FROM UserProfiles WHERE 1 = 1';
    filters.forEach((filter) => {
      query += ` AND ${filter} = ?`;
    });
    query += ';';

    sql.query(query, values, (err, res) => {
      console.log(query, values, err, res);
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

export default User;
