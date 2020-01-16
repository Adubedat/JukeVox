import moment from 'moment';
import sql from '../../../db';
import DATETIME_FORMAT from '../constants';

const User = function () {

};

User.createUser = function createUser(user) {
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

User.getUserProfileByEmail = function getUserProfileByEmail(email) {
  return new Promise(((resolve, reject) => {
    const query = 'SELECT * FROM `UserProfiles` WHERE `email` = ?';
    sql.query(query, email, (err, res) => {
      if (err) {
        console.log(`getUserProfileByEmail query error : ${err}`);
        reject(err);
      } else {
        resolve(res);
      }
    });
  }));
};

User.getUserAccountById = function getUserAccountById(id) {
  return new Promise(((resolve, reject) => {
    const query = 'SELECT * FROM `UserAccounts` WHERE `UserProfileId` = ?';
    sql.query(query, id, (err, res) => {
      if (err) {
        console.log(`getUserAccountById query error : ${err}`);
        reject(err);
      } else {
        console.log(`getUserAccountById query success: ${res}`);
        resolve(res);
      }
    });
  }));
};

User.getProviderAccountsById = function getProviderAccountsById(id) {
  return new Promise(((resolve, reject) => {
    const query = 'SELECT * FROM `ProviderAccounts` WHERE `UserProfileId` = ?';
    sql.query(query, id, (err, res) => {
      if (err) {
        console.log(`getProviderAccountsById query error : ${err}`);
        reject(err);
      } else {
        console.log(res);
        resolve(res);
      }
    });
  }));
};

export default User;
