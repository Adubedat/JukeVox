import moment from 'moment';
import DATETIME_FORMAT from '../constants';
import sql from '../../helpers/database';

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

    const query = 'INSERT INTO UserAccounts (UserProfileId, Email, Password, ConfirmationToken, TokenExpiration) \
    VALUES ?';
    const values = [[userProfileId, email, password, token, expirationDate]];

    sql.query(query, [values])
      .then((res) => {
        res.ConfirmationToken = token;
        resolve(res);
      })
      .catch((err) => reject(err));
  });
};

User.createProviderAccount = function createProviderAccount(userId, providerId, provider) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId) VALUES ?';
    const values = [[userId, provider, providerId]];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.deleteUserAccount = function deleteUserAccount(userId) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM UserAccounts WHERE UserProfileId = ?';
    sql.query(query, userId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.deleteUserProviders = function deleteUserProviders(userId) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM ProviderAccounts WHERE UserProfileId = ?';
    sql.query(query, userId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.updateUserProfile = function updateUserProfile(userId, username, email, profilePicture) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE UserProfiles SET Username = ?, Email = ?, ProfilePicture = ? WHERE Id = ?';
    const values = [username, email, profilePicture, userId];
    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.updateUserAccount = function updateUserAccount(userId, userAccount) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE UserAccounts SET Password = ?, ConfirmationToken = ? WHERE UserProfileId = ?';
    const values = [userAccount.Password, userAccount.ConfirmationToken, userId];
    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

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

User.getProviderAccounts = function getProviderAccounts(filters, values) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM ProviderAccounts WHERE 1 = 1';
    filters.forEach((filter) => {
      query += ` AND ${filter} = ?`;
    });
    query += ';';

    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

User.confirmUserEmail = function confirmUserEmail(token) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE UserAccounts SET EmailConfirmed = true, ConfirmationToken = NULL, TokenExpiration = NULL WHERE ConfirmationToken = ?';
    sql.query(query, token)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default User;
