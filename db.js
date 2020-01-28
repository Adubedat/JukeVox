import mysql from 'mysql';
import params from './params';

// TODO: Change connection into connection pool

// local mysql db connection
let dbParams;

if (process.env.NODE_ENV === 'test') {
  dbParams = params.test.database;
} else {
  dbParams = params.database;
}
const connection = mysql.createConnection(dbParams);

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to database!');
});

export default connection;
