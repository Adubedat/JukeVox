import FB from 'fb';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import User from '../../models/userModel';

async function validateBody(accessToken) {
  if (typeof accessToken !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError accessToken: expected string but received ${typeof accessToken}`);
  }
}

export default async function linkFacebook(req, res, next) {
  const { accessToken } = req.body;
  const { userId } = req.decoded;

  try {
    validateBody(accessToken);
    checkUnknownFields(['accessToken'], req.body);
    const resp = await FB.api('me', { fields: 'id,email,first_name,last_name', access_token: accessToken });
    const providerId = resp.id;
    if (!resp || resp.error) {
      throw new ErrorResponseHandler(400, 'Invalid facebook access token');
    }

    const [providerAccount] = await User.getProviderAccounts(['ProviderId', 'Provider'], [providerId, 'Facebook']);
    if (providerAccount !== undefined) {
      throw new ErrorResponseHandler(409, 'This facebook account is already linked');
    }

    const response = await User.createProviderAccount(userId, providerId, 'Facebook');
    if (response.affectedRows !== 1) {
      throw new ErrorResponseHandler(500, 'Internal server error');
    }

    res.send({
      message: 'Facebook account successfully linked',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
