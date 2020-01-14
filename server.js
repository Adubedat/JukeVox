'use strict';

const express = require('express');
const params = require('./params');
const routes = require('./src/server/routes');

const port = process.env.PORT || params.port;
const app = express();

app.listen(port);
routes(app);

console.log('Music Room RESTful API server started on port: ' + port);