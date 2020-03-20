import argon2 from 'argon2';
import ejs from 'ejs';
import { checkUnknownFields, validatePassword } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';
import User from '../../models/userModel';


async function validateBody(newPassword) {
  if (typeof newPassword !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError newPassword: expected string but received ${typeof newPassword}`);
  }
  validatePassword(newPassword);
}

export default async function resetPassword(req, res, next) {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    checkUnknownFields(['newPassword'], req.body);
    await validateBody(newPassword);
    const [userAccount] = await User.getUserAccount(['ConfirmationToken'], [token]);
    if (userAccount === undefined) {
      throw new ErrorResponseHandler(404, 'Token does not exist');
    }

    userAccount.Password = await argon2.hash(newPassword);
    userAccount.ConfirmationToken = null;
    userAccount.TokenExpiration = null;

    const response = await User.updateUserAccount(userAccount.UserProfileId, userAccount);
    if (response.affectedRows !== 1) {
      throw new ErrorResponseHandler(500, 'Internal Server Error');
    }
    ejs.renderFile(`${__dirname}/../../../../templates/resetPasswordConfirmation.ejs`, {}, (err, data) => {
      res.send(data);
    });
  } catch (err) {
    next(err);
  }
}
