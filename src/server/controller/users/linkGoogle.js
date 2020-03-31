import * as admin from 'firebase-admin';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import User from '../../models/userModel';

async function validateBody(idToken) {
  if (typeof idToken !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError idToken: expected string but received ${typeof idToken}`);
  }
}


export default async function linkGoogle(req, res, next) {
  const { idToken } = req.body;
  const { userId } = req.decoded;

  try {
    validateBody(idToken);
    checkUnknownFields(['idToken'], req.body);
    const decodedToken = await admin.auth().verifyIdToken(idToken).catch((error) => {
      throw new ErrorResponseHandler(400, error.errorInfo.message);
    });
    const providerId = decodedToken.uid;

    const [providerAccount] = await User.getProviderAccounts(['ProviderId', 'Provider'], [providerId, 'Google']);

    if (providerAccount !== undefined) {
      throw new ErrorResponseHandler(409, 'This google account is already linked');
    }

    const response = await User.createProviderAccount(userId, providerId, 'Google');
    if (response.affectedRows !== 1) {
      throw new ErrorResponseHandler(500, 'Internal server error');
    }

    res.send({
      message: 'Google account successfully linked',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
