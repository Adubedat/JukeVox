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

export default User;
