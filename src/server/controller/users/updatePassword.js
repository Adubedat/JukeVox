import argon2 from 'argon2';
import { checkUnknownFields, validatePassword } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';
import User from '../../models/userModel';


async function validateBody(oldPassword, newPassword) {
  if (typeof oldPassword !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError oldPassword: expected string but received ${typeof oldPassword}`);
  }
  if (typeof newPassword !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError newPassword: expected string but received ${typeof newPassword}`);
  }
  validatePassword(newPassword);
}

export default async function updatePassword(req, res, next) {
  const { userId } = req.decoded;
  const { oldPassword, newPassword } = req.body;

  try {
    checkUnknownFields(['oldPassword', 'newPassword'], req.body);
    await validateBody(oldPassword, newPassword);
    const [userAccount] = await User.getUserAccount(['UserProfileId'], [userId]);
    if (userAccount === undefined) throw new ErrorResponseHandler(404, 'User Account not found');
    if (!(await argon2.verify(userAccount.Password, oldPassword))) {
      throw new ErrorResponseHandler(400, 'Invalid oldPassword');
    }
    const newHash = await argon2.hash(newPassword);
    userAccount.Password = newHash;
    await User.updateUserAccount(userId, userAccount);
    res.send({
      message: 'Password successfully updated',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
