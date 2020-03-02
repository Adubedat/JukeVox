import FB from 'fb';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import { generateJwt } from '../../../helpers/utils';
import User from '../../models/userModel';

async function validateBody(accessToken) {
  if (typeof accessToken !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError accessToken: expected string but received ${typeof accessToken}`);
  }
}

async function generateUsername(firstName, lastName) {
  let username = firstName.substring(0, 1) + lastName;
  username = username.substring(0, 16);
  const randomNumber = Math.floor(Math.random() * 1000) + 1;
  username += randomNumber;
  const [userProfile] = await User.getUserProfile(['Username'], [username]);
  console.log('generateusername');
  console.log(userProfile);
  if (userProfile !== undefined) {
    return generateUsername(firstName, lastName);
  }
  return username;
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
        throw new ErrorResponseHandler(400, 'Unvalid facebook access token');
      }

      const [[providerAccount], [userProfileByEmail]] = await Promise.all([User.getProviderAccounts(['ProviderId', 'Provider'], [providerId, 'Facebook']),
        User.getUserProfile(['Email'], [resp.email])]);
      console.log(resp);
      console.log(providerAccount);
      console.log(userProfileByEmail);
      if (providerAccount === undefined && userProfileByEmail === undefined) {
        console.log('first case');
        const username = await generateUsername(resp.first_name, resp.last_name);
        const createResponse = await User.createUserProfile(username, resp.email);
        [userProfile] = await User.getUserProfile(['Id'], [createResponse.insertId]);
        await User.createProviderAccount(userProfile.Id, providerId, 'Facebook');
      } else if (providerAccount === undefined && userProfileByEmail !== undefined) {
        console.log('second case');
        userProfile = userProfileByEmail;
        await User.createProviderAccount(userProfile.Id, providerId, 'Facebook');
      } else if (providerAccount !== undefined) {
        console.log('third case');
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
