import moment from 'moment';
import DATETIME_FORMAT from '../constants';
import Database from '../../helpers/database';

const sql = new Database();

const User = function () {

};

User.createUserProfile = function createUserProfile(username, email) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) \
    VALUES ?';
    const values = [[username, email, moment().format(DATETIME_FORMAT)]];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.createUserAccount = function createUserAccount(userProfileId, email, password, token) {
  return new Promise((resolve, reject) => {
    const expirationDate = moment().add(3, 'd').format(DATETIME_FORMAT);

    // TODO: update dbdiagram (emailconfirmationString)
    const query = 'INSERT INTO UserAccounts (UserProfileId, Email, Password, EmailConfirmationString, AccountExpiration) \
    VALUES ?';
    const values = [[userProfileId, email, password, token, expirationDate]];

    sql.query(query, [values])
      .then((res) => {
        res.emailConfirmationString = token;
        resolve(res);
      })
      .catch((err) => reject(err));
  });
};

// User.deleteUserAccount = function deleteUserAccount(userId) {
//   return new Promise(async (resolve, reject) => {
//     const query = 'DELETE FROM UserAccounts WHERE UserProfileId = ?';
//     await
//   })
// }

// User.deleteUserProviders = function deleteUserProviders(userId) {
//   return new Promise(());
// }

// User.updateUserProfile = function updateUserProfile(userId, username, email, profilePicture) {
//   return new Promise(());
// }

User.getUserProfile = function getUserProfile(filters, values) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM UserProfiles WHERE 1 = 1';
    filters.forEach((filter) => {
      query += ` AND ${filter} = ?`;
    });
    query += ';';

    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.getUserAccount = function getUserAccount(filters, values) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM UserAccounts WHERE 1 = 1';
    filters.forEach((filter) => {
      query += ` AND ${filter} = ?`;
    });
    query += ';';

    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.getProviderAccountsById = function getProviderAccountsById(userId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM ProviderAccounts WHERE UserProfileId = ?';
    sql.query(query, userId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.confirmUserEmail = function confirmUserEmail(token) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE UserAccounts SET EmailConfirmed = true, EmailConfirmationString = NULL WHERE EmailConfirmationString = ?';
    sql.query(query, token)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default User;
