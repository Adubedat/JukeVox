import argon2 from 'argon2';
import { ErrorResponseHandler } from '../../../helpers/error';
import User from '../../models/userModel';
import { checkUnknownFields } from '../../../helpers/validation';

// TODO: How to handle deleteUser protection ? Password is a bad id when log in with provider

async function validateBody(userId, password) {
  if (typeof password !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError password: expected string but received ${typeof password}`);
  }
  const userAccount = await User.getUserAccount(['UserProfileId'], [userId]);
  if (userAccount.length === 0) {
    throw new ErrorResponseHandler(404, 'No account found: Wrong token provided');
  }
  if (!(await argon2.verify(userAccount[0].Password, password))) {
    throw new ErrorResponseHandler(400, 'Invalid password');
  }
}

export default async function deleteUser(req, res, next) {
  const { userId } = req.decoded;
  const { password } = req.body;

  try {
    await validateBody(userId, password);
    checkUnknownFields(['password'], req.body);
    await Promise.all([
      User.deleteUserAccount(userId),
      User.deleteUserProviders(userId),
      User.deleteAllUserFriendships(userId),
      User.updateUserProfile(userId, null, null, null),
    ]);
    res.send({
      message: 'User deleted',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
