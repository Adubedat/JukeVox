
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

export function getUserAccountsTypes(req, res) {
  const { email } = req.params;
  // TODO : verify valid email
  User.getUserProfileByEmail(email)
    .then(async (response) => {
      const { Id } = response[0];
      if (!Id) {
        res.send({
          message: 'Email does not match any account',
          data: [],
        });
      } else {
        const accountTypes = await getAccountTypes(Id);
        console.log(`The account types are: ${accountTypes}`);
        res.send({
          message: 'Email matches these account types',
          data: accountTypes,
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
}
