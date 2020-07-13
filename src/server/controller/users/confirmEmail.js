import ejs from 'ejs';
import User from '../../models/userModel';
import Logs, { ACCOUNT_CONFIRMED } from '../../models/logsModel';
import { ErrorResponseHandler } from '../../../helpers/error';

export default async function confirmEmail(req, res, next) {
  const { token } = req.params;

  try {
    const userAccount = await User.getUserAccount(['ConfirmationToken'], [token]);
    if (userAccount.length === 0) {
      throw new ErrorResponseHandler(404, 'Token does not exist');
    }
    const confirmation = await User.confirmUserEmail(token);
    if (confirmation.affectedRows > 0) {
      ejs.renderFile(`${__dirname}/../../../../templates/emailConfirmed.ejs`, {}, (err, data) => {
        res.send(data);
      });
      Logs.addLog(ACCOUNT_CONFIRMED, 'Account confirmed', userAccount[0].UserProfileId);
    }
  } catch (err) {
    next(err);
  }
}
