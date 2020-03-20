import ejs from 'ejs';
import moment from 'moment';
import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import DATETIME_FORMAT from '../../constants';
import { generateUniqueToken } from '../../../helpers/utils';
import { sendResetPasswordLink } from '../../../helpers/sendMailWithTemplate';

function validateBody(email) {
  if (typeof email !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError email: expected string but received ${typeof email}`);
  }
}

export default async function forgotPassword(req, res, next) {
  const { email } = req.body;

  try {
    validateBody(email);
    checkUnknownFields(['email'], req.body);
    const [userAccount] = await User.getUserAccount(['Email'], [email]);
    if (userAccount === undefined) {
      throw new ErrorResponseHandler(404, 'No account found for this email');
    }
    if (!userAccount.EmailConfirmed) {
      throw new ErrorResponseHandler(403, 'Your account is not confirmed');
    }
    userAccount.ConfirmationToken = await generateUniqueToken();
    userAccount.TokenExpiration = moment().add(1, 'd').format(DATETIME_FORMAT);
    const response = await User.updateUserAccount(userAccount.UserProfileId, userAccount);
    if (response.affectedRows !== 1) {
      throw new ErrorResponseHandler(500, 'Internal Server Error');
    }
    await sendResetPasswordLink(email, userAccount.ConfirmationToken);
    res.status(200).send({
      message: 'Reset password mail sent',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
