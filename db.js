
import mysql from 'mysql';
import params from './params';

// TODO: Change connection into connection pool

// local mysql db connection
const connection = mysql.createConnection(params.database);

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to database!');
});

export default connection;
