import {} from 'dotenv/config';
import openRoutes from './src/server/routes/openRoutes'; // eslint-disable-line
import protectedRoutes from './src/server/routes/protectedRoutes'; // eslint-disable-line
import params from './params'; // eslint-disable-line
import { handleError } from './src/helpers/error'; // eslint-disable-line

// TODO: Fix return codes

const express = require('express');

const port = process.env.PORT || params.port;

const app = express();

const http = require('http').createServer(app);
const socketio = require('socket.io')(http);

socketio.on('connection', (userSocket) => {
  console.log('User Connected');

  userSocket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// TODO: Make port into env or params port
socketio.listen(5001);

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
