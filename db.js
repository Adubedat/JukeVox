import mysql from 'mysql';
import params from './params';
import logger from './src/helpers/logger';

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
  logger.info('Connected to database!');
});

export default connection;
