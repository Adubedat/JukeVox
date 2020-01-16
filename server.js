
// const routes = require('./src/server/routes');
import bodyParser from 'body-parser';
import routes from './src/server/routes';
import params from './params';

const express = require('express');

const port = process.env.PORT || params.port;
const app = express();

app.listen(port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routes(app);

console.log(`Music Room RESTful API server started on port: ${port}`);
