import validator from 'validator';
import nodemailer from 'nodemailer';
import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { ErrorResponseHandler } from '../../helpers/error';

async function checkTokenIsUnique(token) {
  const response = await User.getUserAccount(['EmailConfirmationString'], [token]);
  if (response.length > 0) {
    return false;
  }
  return true;
}

async function generateUniqueToken() {
  const token = crypto.randomBytes(24).toString('hex');
  if (!(await checkTokenIsUnique(token))) {
    return generateUniqueToken();
  }
  return token;
}

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

function generateJwt(userId) {
  const payload = {
    userId,
  };
  const expiresIn = 3600 * 24 * 365; // one year
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
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

  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log(err);
      throw new ErrorResponseHandler(500, 'Internal server Error');
    }
    return console.log('Message sent: %s', info.messageId);
  });
}

async function getAccountTypes(id) {
  const accountTypes = [];
  const [userAccount, providerAccounts] = await Promise.all([User.getUserAccount(['userProfileId'], [id]),
    User.getProviderAccountsById(id)]);
  if (userAccount.length > 0) {
    accountTypes.push('Classic');
  }
  providerAccounts.forEach((result) => accountTypes.push(result.Provider));
  return accountTypes;
}

export async function createUser(req, res, next) {
  const { username, email, password } = req.body;

  try {
    await validateInput(username, email, password);
    const hash = await argon2.hash(password).catch((err) => {
      console.log(err);
      throw new ErrorResponseHandler(500, 'Internal server Error');
    });
    const [token, userProfile] = await Promise.all([generateUniqueToken(),
      User.createUserProfile(username, email)]);
    const userAccount = await User.createUserAccount(userProfile.insertId, email, hash, token);
    sendConfirmationEmail(email, userAccount.emailConfirmationString);
    res.status(201).send({
      message: 'User created. Please check your mail!',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserAccountsTypes(req, res, next) {
  const { email } = req.params;
  try {
    const response = await User.getUserProfile(['email'], [email]);
    if (response.length === 0) {
      throw new ErrorResponseHandler(404, 'No account found for this email');
    }
    const id = response[0].Id;
    const accountTypes = await getAccountTypes(id);

    res.send({
      message: 'Email matches these account types',
      accountTypes,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}

export async function searchForUser(req, res, next) {
  const possibleFilters = ['username', 'email'];

  const existingFilters = possibleFilters.filter((field) => req.query[field]);
  const values = existingFilters.map((filter) => (req.query[filter]));

  try {
    for (const query in req.query) {
      if (!(possibleFilters.includes(query)))
        throw new ErrorResponseHandler(404, `Unknown query: ${query}`);
    }

    const response = await User.getUserProfile(existingFilters, values);
    if (response.length === 0) {
      throw new ErrorResponseHandler(404, 'No user found');
    }
    const user = response;

    res.send({
      message: 'Users found',
      data: user,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmUserEmail(req, res, next) {
  const { token } = req.params;

  try {
    const userAccount = await User.getUserAccount(['EmailConfirmationString'], [token]);
    if (userAccount.length === 0) {
      throw new ErrorResponseHandler(404, 'Token does not exist');
    }
    const confirmation = await User.confirmUserEmail(token);
    if (confirmation.affectedRows > 0) {
      const jsonToken = generateJwt(userAccount[0].UserProfileId);
      res.send({
        message: 'Email successfully confirmed',
        jwt: jsonToken,
        statusCode: 200,
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function loginUser(req, res, next) {
  const { email, password } = req.body;

  try {
    const userAccount = await User.getUserAccount(['email'], [email]);
    if (userAccount.length === 0) {
      throw new ErrorResponseHandler(404, 'No account found for this email');
    }
    if (!(await argon2.verify(userAccount[0].Password, password))) {
      throw new ErrorResponseHandler(400, 'Invalid password');
    }
    const token = generateJwt(userAccount[0].UserProfileId);
    res.send({
      message: 'User succesfully connected !',
      jwt: token,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
