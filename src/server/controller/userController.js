import validator from 'validator';
import nodemailer from 'nodemailer';
import User from '../models/userModel';

async function validateUsername(username) {
  if (!validator.isAlphanumeric(username)) {
    return ('Username must only contain numbers or letters');
  }
  try {
    const response = await User.getUserProfile(['username'], [username]);
    if (response.length > 0) {
      return ('There already is an account with this username');
    }
  } catch (error) {
    return (error);
  }
  return null;
}

async function validateEmail(email) {
  if (!validator.isEmail(email)) {
    return ('Email not correctly formatted');
  }
  try {
    const response = await User.getUserProfile(['email'], [email]);
    if (response.length > 0) {
      return ('There already is an account with this email');
    }
  } catch (error) {
    return (error);
  }
  return null;
}

function validatePassword(password) {
  if (password.length < 10) {
    return ('Your password must have at least 10 characters.');
  }
  return null;
}

async function validateInput(username, email, password) {
  let error;
  error = await validateUsername(username);
  if (error != null) { return error; }
  error = await validateEmail(email);
  if (error != null) { return error; }
  error = validatePassword(password);
  return error;
}

function sendConfirmationEmail(email, emailConfirmationString) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const message = {
    from: 'noreply@domain.com',
    to: email,
    subject: 'Confirm your email',
    text: `Please click the following link to validate your email : https://localhost:5000/${emailConfirmationString}`,
    html: `<p>Please click the following link to validate your email : https://localhost:5000/${emailConfirmationString}</p>`,
  };

  transporter.sendMail(message, (error, info) => {
    if (error) {
      return console.log(error);
    }
    return console.log('Message sent: %s', info.messageId);
  });
}

export async function createUser(req, res) {
  const { username, email, password } = req.body;
  const error = await validateInput(username, email, password);

  if (error) {
    res.status(400).send(error);
    return;
  }
  try {
    const userProfile = await User.createUserProfile(username, email);
    const userAccount = await User.createUserAccount(userProfile.insertId, email, password);
    sendConfirmationEmail(email, userAccount.emailConfirmationString);
    res.status(200).send('User created. Please check your mail!');
  } catch (err) {
    console.log(err);
  }
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

    res.send({
      message: 'The user matching this username is',
      data: user,
    });
  } catch (error) {
    res.status(500).send(error);
  }
}
