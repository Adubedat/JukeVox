import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';
import { generateJwt } from '../../../helpers/utils';

export default async function confirmEmail(req, res, next) {
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
