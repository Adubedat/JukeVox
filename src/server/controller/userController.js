
const User = require('../models/userModel');

exports.createUser = function createUser(req, res) {
  console.log('wollah');
  User.createUser({ username: 'Bob' })
    .then((response) => {
      console.log(response);
      res.send(response);
    });
};
