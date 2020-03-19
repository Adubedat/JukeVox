import User from '../../models/userModel';
import Friendships from '../../models/friendshipsModel';
import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';

async function validateBody(addresseeId) {
  const [userProfile] = await User.getUserProfile(['Id'], [addresseeId]);
  if (userProfile === undefined) {
    throw new ErrorResponseHandler(400, 'addresseeId must match an existing user');
  }
}

export default async function deleteFriendship(req, res, next) {
  const { userId } = req.decoded;
  const { addresseeId } = req.params;

  try {
    await validateBody(addresseeId);
    checkUnknownFields(['addresseeId'], req.params);
    await Friendships.deleteFriendship(userId, addresseeId);
    res.status(200).send({
      message: 'Friendship deleted',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
