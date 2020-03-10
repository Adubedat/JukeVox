import {} from 'dotenv/config';
import openRoutes from './src/server/routes/openRoutes'; // eslint-disable-line
import protectedRoutes from './src/server/routes/protectedRoutes'; // eslint-disable-line
import params from './params'; // eslint-disable-line
import { handleError } from './src/helpers/error'; // eslint-disable-line

// TODO: Fix return codes

const express = require('express');

const port = process.env.PORT || params.port;
const app = express();

const socketio = require('socket.io')(app);

socketio.on('connection', (userSocket) => {
  console.log('user connected');
  userSocket.on('send_message', (data) => {
    userSocket.broadcast.emit('receive_message', data);
  });
});

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
