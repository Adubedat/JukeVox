const params = {
  port: 5000,
  database: {
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'JukeVox',
  },
  test: {
    database: {
      port: process.env.DB_PORT || 3306,
      host: '127.0.0.1',
      user: 'root',
      password: 'root',
      database: 'JukeVoxTest',
    },
  },
};

export default params;
