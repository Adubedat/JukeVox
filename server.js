import dotenv from 'dotenv';
import routes from './src/server/routes';
import params from './params';

import { handleError } from './src/helpers/error';

// TODO: Fix return codes

dotenv.config();
const express = require('express');

const port = process.env.PORT || params.port;
const app = express();

app.listen(port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routes(app);
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  handleError(err, res);
});

console.log(`Music Room RESTful API server started on port: ${port}`);
