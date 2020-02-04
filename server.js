import dotenv from 'dotenv';
import openRoutes from './src/server/routes/openRoutes';
import protectedRoutes from './src/server/routes/protectedRoutes';
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
app.use('/', openRoutes);
app.use('/api', protectedRoutes);
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  handleError(err, res);
});

module.exports = app;

console.log(`Music Room RESTful API server started on port: ${port}`);
