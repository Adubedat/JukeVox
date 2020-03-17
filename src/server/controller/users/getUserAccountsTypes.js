import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';

async function getAccountTypes(id) {
  const accountTypes = [];
  const [userAccount, providerAccounts] = await Promise.all([User.getUserAccount(['userProfileId'], [id]),
    User.getProviderAccounts(['UserProfileId'], [id])]);
  if (userAccount.length > 0) {
    accountTypes.push('Classic');
  }
  providerAccounts.forEach((result) => accountTypes.push(result.Provider));
  return accountTypes;
}

export default async function getUserAccountsTypes(req, res, next) {
  const { email } = req.params;
  try {
    const [userProfile] = await User.getUserProfile(['email'], [email]);
    if (userProfile === undefined) {
      throw new ErrorResponseHandler(404, 'No account found for this email');
    }
    const accountTypes = await getAccountTypes(userProfile.Id);

    if (accountTypes.length === 0) {
      throw new ErrorResponseHandler(409, 'Please contact an administrator');
    }

    res.send({
      message: 'Email matches these account types',
      accountTypes,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
