
// const routes = require('./src/server/routes');
import routes from './src/server/routes';
import params from './params';

const express = require('express');

const port = process.env.PORT || params.port;
const app = express();

app.listen(port);
routes(app);

console.log(`Music Room RESTful API server started on port: ${port}`);
