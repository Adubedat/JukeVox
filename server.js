import {} from 'dotenv/config';
import openRoutes from './src/server/routes/openRoutes'; // eslint-disable-line
import protectedRoutes from './src/server/routes/protectedRoutes'; // eslint-disable-line
import params from './params'; // eslint-disable-line
import { handleError } from './src/helpers/error'; // eslint-disable-line
import initListeners from './src/server/sockets/listeners';
import logger from './src/helpers/logger';

const express = require('express');

const port = process.env.PORT || params.port;

const app = express();

const server = require('http').createServer(app);
const socketio = require('socket.io').listen(server);

initListeners(socketio);

server.listen(port);

app.use((req, res, next) => {
  req.io = socketio;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', openRoutes);
app.use('/api', protectedRoutes);
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  handleError(err, req, res);
});

module.exports = app;

logger.info(`Music Room RESTful API server started on port: ${port}`);
