
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

async function getAccountTypes(Id) {
  Promise.all([User.getUserAccountById(Id), User.getProviderAccountsById(Id)])
    .then((response) => ('test'));
}

export function registerUser(req, res) {
  const { email } = req.body;
  // TODO : verify valid email
  User.getUserProfileByEmail(email)
    .then(async (response) => {
      const { Id } = response[0];
      if (!Id) {
        res.send('UserProfile does not exists');
      } else {
        const accountTypes = await Promise.all([User.getUserAccountById(Id), User.getProviderAccountsById(Id)]);
        console.log(accountTypes);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
