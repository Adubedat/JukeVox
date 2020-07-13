import moment from 'moment';
import DATETIME_FORMAT from '../constants';
import sql from '../../helpers/database';

export const ACCOUNT_CREATED = 1;
export const ACCOUNT_DELETED = 2;
export const ACCOUNT_CONFIRMED = 3;
export const EVENT_CREATED = 4;

const Logs = function () {

};

Logs.addLog = function addLog(type, description, userId) {
  return new Promise((resolve, reject) => {
    const occuredAt = moment().format(DATETIME_FORMAT);
    const query = 'INSERT INTO Logs (EventType, UserId, Description, \
      EventDate) VALUES ? ';
    const values = [[type, userId, description, occuredAt]];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default Logs;
