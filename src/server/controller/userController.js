
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
  try {
    const accountTypes = [];
    const results = await Promise.all([User.getUserAccountById(Id),
      User.getProviderAccountsById(Id)]);
    if (results[0].length > 0) {
      accountTypes.push('Classic');
    }
    results[1].forEach((result) => accountTypes.push(result.Provider));
    return accountTypes;
  } catch (error) {
    console.log(error);
    return (null);
  }
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
        const accountTypes = await getAccountTypes(Id);
        console.log(`The account types are: ${accountTypes}`);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
