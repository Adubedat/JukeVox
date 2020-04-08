import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';

export default async function getLinkedAccounts(req, res, next) {
  const { userId } = req.decoded;
  try {
    const accounts = await User.getProviderAccounts(['UserProfileId'], [userId]);
    if (accounts.length === 0) {
      throw new ErrorResponseHandler(404, 'No account found for this email');
    }

    res.send({
      message: 'Accounts found',
      accounts,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
