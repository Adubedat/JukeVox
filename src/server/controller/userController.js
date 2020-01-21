
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
  if (Id) {
    const results = await Promise.all([User.getUserAccountById(Id),
      User.getProviderAccountsById(Id)]);
    if (results[0].length > 0) {
      accountTypes.push('Classic');
    }
    results[1].forEach((result) => accountTypes.push(result.Provider));
  }
  return accountTypes;
}

export async function getUserAccountsTypes(req, res) {
  const { email } = req.params;

  try {
    const response = await User.getUserProfile('email', email);
    const id = response[0].Id;
    const accountTypes = await getAccountTypes(id);

    res.send({
      message: 'Email matches these account types',
      data: accountTypes,
    });
  } catch (error) {
    res.status(500).send(error);
  }
}

export async function searchForUser(req, res) {
  const existingFilters = ['username', 'email'].filter((field) => req.query[field]);
  const values = existingFilters.map((filter) => (req.query[filter]));

  try {
    const response = await User.getUserProfile(existingFilters, values);

    const user = response;

    console.log(response[0]);
    res.send({
      message: 'The user matching this username is',
      data: user,
    });
  } catch (error) {
    res.status(500).send(error);
  }
}
