import * as admin from 'firebase-admin';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import { generateJwt, generateUsername } from '../../../helpers/utils';
import User from '../../models/userModel';

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.GOOGLE_CREDENTIALS)),
});

async function validateBody(idToken) {
  if (typeof idToken !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError idToken: expected string but received ${typeof idToken}`);
  }
}


export default async function googleLogin(req, res, next) {
  const { idToken } = req.body;
  let userProfile;

  try {
    validateBody(idToken);
    checkUnknownFields(['idToken'], req.body);
    const decodedToken = await admin.auth().verifyIdToken(idToken).catch((error) => {
      console.log(error);
      throw new ErrorResponseHandler(400, error.errorInfo.message);
    });
    const providerId = decodedToken.uid;

    const [[providerAccount], [userProfileByEmail]] = await Promise.all([User.getProviderAccounts(['ProviderId', 'Provider'], [providerId, 'Google']),
      User.getUserProfile(['Email'], [decodedToken.email])]);
    if (providerAccount === undefined && userProfileByEmail === undefined) {
      const username = await generateUsername();
      const createResponse = await User.createUserProfile(username, decodedToken.email);
      [userProfile] = await User.getUserProfile(['Id'], [createResponse.insertId]);
      await User.createProviderAccount(userProfile.Id, providerId, 'Google');
    } else if (providerAccount === undefined && userProfileByEmail !== undefined) {
      userProfile = userProfileByEmail;
      await User.createProviderAccount(userProfile.Id, providerId, 'Google');
    } else if (providerAccount !== undefined) {
      userProfile = await User.getUserProfile(['Id'], [providerAccount.UserProfileId]);
    }

    const jwt = generateJwt(userProfile.Id);
    res.send({
      message: 'User succesfully connected !',
      statusCode: 200,
      jwt,
    });
  } catch (err) {
    next(err);
  }
}
