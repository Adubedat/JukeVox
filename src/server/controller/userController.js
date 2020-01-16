
import User from '../models/userModel';

export function createUser(req, res) {
  console.log('wollah');
  User.createUser({ username: 'Bob' })
    .then((response) => {
      console.log(response);
      res.send(response);
    })
    .catch((error) => {
      console.log(error);
    });
}

export function registerUser(req, res) {
  const { email } = req.body;
  // TODO : verify valid email
  User.getUserProfileByEmail(email)
    .then((response) => {
      console.log(response);
      res.send(response);
    })
    .catch((error) => {
      console.log(error);
    });
}
