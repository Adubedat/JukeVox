import validator from 'validator';
import { ErrorResponseHandler } from './error';
import User from '../server/models/userModel';

export async function validateUsername(username) {
  if (typeof username !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError username: expected string but received ${typeof username}`);
  }

  if (!validator.isAlphanumeric(username)) {
    throw new ErrorResponseHandler(400, 'Username must only contain numbers or letters');
  }
  const response = await User.getUserProfile(['username'], [username]);
  if (response.length > 0) {
    throw new ErrorResponseHandler(409, 'There already is an account with this username');
  }
}

export async function validateEmail(email) {
  if (typeof email !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError email: expected string but received ${typeof email}`);
  }
  if (!validator.isEmail(email)) {
    throw new ErrorResponseHandler(400, 'Email not correctly formatted');
  }
  const response = await User.getUserProfile(['email'], [email]);
  if (response.length > 0) {
    throw new ErrorResponseHandler(409, 'There already is an account with this email');
  }
}

export function validatePassword(password) {
  if (typeof password !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError password: expected string but received ${typeof password}`);
  }
  if (password.length < 10) {
    throw new ErrorResponseHandler(400, 'Your password must have at least 10 characters');
  }
}

export function checkUnknownFields(allowedFields, fields) {
  Object.keys(fields).forEach((field) => {
    if (!(allowedFields.includes(field))) {
      throw new ErrorResponseHandler(400, `Unknown field: ${field}`);
    }
  });
}
