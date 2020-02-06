import argon2 from 'argon2';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import { generateJwt } from '../../../helpers/utils';
import User from '../../models/userModel';

async function validateBody(email, password) {
  if (typeof email !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError email: expected string but received ${typeof email}`);
  }
  if (typeof password !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError password: expected string but received ${typeof password}`);
  }
}

async function verifyCredentials(userAccount, password) {
  if (userAccount === undefined) {
    throw new ErrorResponseHandler(404, 'No account found for this email');
  }
  if (userAccount.EmailConfirmed === 0) {
    throw new ErrorResponseHandler(403, 'Email not confirmed');
  }
  if (!(await argon2.verify(userAccount.Password, password))) {
    throw new ErrorResponseHandler(400, 'Invalid password');
  }
}

export default async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    await validateBody(email, password);
    checkUnknownFields(['email', 'password'], req.body);
    const [userAccount] = await User.getUserAccount(['email'], [email]);
    await verifyCredentials(userAccount, password);
    const token = generateJwt(userAccount.UserProfileId);
    res.send({
      message: 'User succesfully connected !',
      jwt: token,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
