import axios from 'axios';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';
import User from '../../models/userModel';

async function validateBody(accessToken) {
  if (typeof accessToken !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError accessToken: expected string but received ${typeof accessToken}`);
  }
}

export default async function linkDeezer(req, res, next) {
  const { accessToken } = req.body;
  const { userId } = req.decoded;
  const url = 'https://api.deezer.com/user/me';


  try {
    validateBody(accessToken);
    checkUnknownFields(['accessToken'], req.body);

    const resp = await axios.get(url, { params: { access_token: accessToken } });
    if (!resp || !resp.data || resp.data.error) {
      throw new ErrorResponseHandler(400, 'Invalid deezer access token');
    }
    const providerId = resp.data.id;
    const [providerAccount] = await User.getProviderAccounts(['ProviderId', 'Provider'], [providerId, 'Deezer']);
    if (providerAccount !== undefined) {
      throw new ErrorResponseHandler(409, 'This deezer account is already linked');
    }

    const response = await User.linkDeezerAccount(userId, providerId, accessToken, 'Deezer');
    if (response.affectedRows !== 1) {
      throw new ErrorResponseHandler(500, 'Internal server error');
    }

    res.send({
      message: 'Deezer account successfully linked',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
