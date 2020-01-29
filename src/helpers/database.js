import mysql from 'mysql';
import params from '../../params';

class Database {
  constructor() {
    if (process.env.NODE_ENV === 'test') {
      this.connection = mysql.createConnection(params.test.database);
    } else {
      this.connection = mysql.createConnection(params.database);
    }
  }

  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) { return reject(err); }
        resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.connection.end((err) => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }
}

export default Database;
