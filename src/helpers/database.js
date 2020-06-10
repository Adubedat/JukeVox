import mysql from 'mysql';
import params from '../../params';
import logger from './logger';

class Database {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL);
    } else if (process.env.NODE_ENV === 'test') {
      this.pool = mysql.createPool(params.test.database);
    } else {
      this.pool = mysql.createPool(params.database);
    }
  }

  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.pool.query(sql, args, (err, rows) => {
        if (err) {
          logger.error(err);
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.pool.end((err) => {
        if (err) { return reject(err); }
        return resolve();
      });
    });
  }
}

export default new Database();
