import ejs from 'ejs';
import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';

export default async function confirmEmail(req, res, next) {
  const { token } = req.params;

  try {
    const userAccount = await User.getUserAccount(['EmailConfirmationString'], [token]);
    if (userAccount.length === 0) {
      throw new ErrorResponseHandler(404, 'Token does not exist');
    }
    const confirmation = await User.confirmUserEmail(token);
    if (confirmation.affectedRows > 0) {
      ejs.renderFile(`${__dirname}/../../../../templates/emailConfirmed.ejs`, {}, (err, data) => {
        console.log(data);
        res.send(data);
      });
    }
  } catch (err) {
    next(err);
  }
}
