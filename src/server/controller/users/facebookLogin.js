import FB from 'fb';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import { generateJwt, generateUsername } from '../../../helpers/utils';
import User from '../../models/userModel';

async function validateBody(accessToken) {
  if (typeof accessToken !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError accessToken: expected string but received ${typeof accessToken}`);
  }
}

export default async function facebookLogin(req, res, next) {
  const { accessToken } = req.body;

  try {
    validateBody(accessToken);
    checkUnknownFields(['accessToken'], req.body);
    FB.api('me', { fields: 'id,email,first_name,last_name', access_token: accessToken }, async (resp) => {
      const providerId = resp.id;
      let userProfile;

      if (!resp || resp.error) {
        throw new ErrorResponseHandler(400, 'Invalid facebook access token');
      }

      const [[providerAccount], [userProfileByEmail]] = await Promise.all([User.getProviderAccounts(['ProviderId', 'Provider'], [providerId, 'Facebook']),
        User.getUserProfile(['Email'], [resp.email])]);
      if (providerAccount === undefined && userProfileByEmail === undefined) {
        const username = await generateUsername(resp.first_name, resp.last_name);
        const createResponse = await User.createUserProfile(username, resp.email);
        [userProfile] = await User.getUserProfile(['Id'], [createResponse.insertId]);
        await User.createProviderAccount(userProfile.Id, providerId, 'Facebook');
      } else if (providerAccount === undefined && userProfileByEmail !== undefined) {
        userProfile = userProfileByEmail;
        await User.createProviderAccount(userProfile.Id, providerId, 'Facebook');
      } else if (providerAccount !== undefined) {
        userProfile = await User.getUserProfile(['Id'], [providerAccount.UserProfileId]);
      }

      const jwt = generateJwt(userProfile.Id);
      res.send({
        message: 'User succesfully connected !',
        statusCode: 200,
        jwt,
      });
    });
  } catch (err) {
    next(err);
  }
}
