import validator from 'validator';
import nodemailer from 'nodemailer';
import User from '../models/userModel';
import { ErrorResponseHandler } from '../../helpers/error';

async function validateUsername(username) {
  if (!validator.isAlphanumeric(username)) {
    throw new ErrorResponseHandler(400, 'Username must only contain numbers or letters');
  }
  const response = await User.getUserProfile(['username'], [username]);
  if (response.length > 0) {
    throw new ErrorResponseHandler(409, 'There already is an account with this username');
  }
}

async function validateEmail(email) {
  if (!validator.isEmail(email)) {
    throw new ErrorResponseHandler(400, 'Email not correctly formatted');
  }
  const response = await User.getUserProfile(['email'], [email]);
  if (response.length > 0) {
    throw new ErrorResponseHandler(409, 'There already is an account with this email');
  }
}

function validatePassword(password) {
  if (password.length < 10) {
    throw new ErrorResponseHandler(400, 'Your password must have at least 10 characters.');
  }
}

async function validateInput(username, email, password) {
  await validateUsername(username);
  await validateEmail(email);
  validatePassword(password);
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
    text: `Please click the following link to validate your email : http://localhost:5000/users/verify/${emailConfirmationString}`,
    html: `<p>Please click the following link to validate your email : http://localhost:5000/users/verify/${emailConfirmationString}</p>`,
  };

  transporter.sendMail(message, (error, info) => {
    if (error) {
      return console.log(error);
    }
    return console.log('Message sent: %s', info.messageId);
  });
}

export async function createUser(req, res, next) {
  const { username, email, password } = req.body;

  try {
    await validateInput(username, email, password);
    const userProfile = await User.createUserProfile(username, email);
    const userAccount = await User.createUserAccount(userProfile.insertId, email, password);
    sendConfirmationEmail(email, userAccount.emailConfirmationString);
    res.status(200).send('User created. Please check your mail!');
  } catch (err) {
    console.log(err);
    next(err);
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

export async function confirmUserEmail(req, res, next) {
  const { token } = req.params;

  try {
    const confirmation = await User.confirmUserEmail(token);
    console.log('The confirmation is ');
    console.log(confirmation);
    if (confirmation.affectedRows > 0) {
      res.status(200).send('User Verified');
    } else {
      throw new ErrorResponseHandler(400, 'Token does not exist');
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
}
