import validator from 'validator';
import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';
import { checkUnknownFields } from '../../../helpers/validation';

async function validateBody(userId, username, profilePicture) {
  if (typeof username !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError username: expected string but received ${typeof username}`);
  }
  if (!validator.isAlphanumeric(username)) {
    throw new ErrorResponseHandler(400, 'Username must only contain numbers or letters');
  }
  const [userProfile] = await User.getUserProfile(['username'], [username]);
  if (userProfile !== undefined && userProfile.Id !== userId) {
    throw new ErrorResponseHandler(409, 'Username already used');
  }
  if (typeof profilePicture !== 'string') {
    throw new ErrorResponseHandler(400, `TypeError profilPicture: expected string but received ${typeof profilePicture}`);
  }
}

export default async function updateUserProfile(req, res, next) {
  const { userId } = req.decoded;
  const { username, profilePicture } = req.body;

  try {
    checkUnknownFields(['username', 'profilePicture'], req.body);
    await validateBody(userId, username, profilePicture);
    const [userProfile] = await User.getUserProfile(['Id'], [userId]);
    await User.updateUserProfile(userId, username, userProfile.Email, profilePicture);
    res.send({
      message: 'UserProfile updated',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
