
import User from '../models/userModel';

export default function createUser(req, res) {
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
