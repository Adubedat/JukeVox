import ejs from 'ejs';
import { ErrorResponseHandler } from '../../../helpers/error';
import User from '../../models/userModel';

export default async function getResetPasswordForm(req, res, next) {
  const { token } = req.params;

  try {
    const [userAccount] = await User.getUserAccount(['ConfirmationToken'], [token]);
    if (userAccount === undefined) {
      throw new ErrorResponseHandler(404, 'Token does not exist');
    }
    const link = `https://jukevox.herokuapp.com/resetPassword/${token}`;
    ejs.renderFile(`${__dirname}/../../../../templates/resetPasswordForm.ejs`, { link }, (err, data) => {
      res.send(data);
    });
  } catch (err) {
    next(err);
  }
}
