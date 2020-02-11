import User from '../../models/userModel';
import Friendships from '../../models/friendshipsModel';
import { checkUnknownFields } from '../../../helpers/validation';
import { ErrorResponseHandler } from '../../../helpers/error';

async function validateBody(addresseeId) {
  if (typeof addresseeId !== 'number') {
    throw new ErrorResponseHandler(400, `TypeError addresseeId: expected number but received ${typeof addresseeId}`);
  }
  const [userProfile] = await User.getUserProfile(['Id'], [addresseeId]);
  if (userProfile === undefined) {
    throw new ErrorResponseHandler(400, 'addresseeId must match an existing user');
  }
}

export default async function createFriendship(req, res, next) {
  const { userId } = req.decoded;
  const { addresseeId } = req.body;

  try {
    await validateBody(addresseeId);
    checkUnknownFields(['addresseeId'], req.body);
    await Friendships.createFriendship(userId, addresseeId);
    res.status(201).send({
      message: 'Friendship created',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
}
