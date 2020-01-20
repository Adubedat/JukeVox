
import User from '../models/userModel';

export function createUser(req, res) {
  User.createUser({ username: 'Bob' })
    .then((response) => {
      res.send(response);
    })
    .catch((error) => {
      console.log(error);
    });
}

async function getAccountTypes(Id) {
  const accountTypes = [];
  const results = await Promise.all([User.getUserAccountById(Id),
    User.getProviderAccountsById(Id)]);
  if (results[0].length > 0) {
    accountTypes.push('Classic');
  }
  results[1].forEach((result) => accountTypes.push(result.Provider));
  return accountTypes;
}

export async function getUserAccountsTypes(req, res) {
  const { email } = req.params;

  try {
    const response = await User.getUserProfileByEmail(email);
    const id = response[0].Id;
    if (!id) {
      res.send({
        message: 'Email does not match any account',
        data: [],
      });
    } else {
      const accountTypes = await getAccountTypes(id);
      res.send({
        message: 'Email matches these account types',
        data: accountTypes,
      });
    }
  } catch (error) {
    res.status(500).send(error);
  }
}
