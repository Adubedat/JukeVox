import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';

export default async function getMe(req, res, next) {
  const { userId } = req.decoded;

  try {
    const [user] = await User.getUserProfile(['Id'], [userId]);
    if (user === undefined) {
      throw new ErrorResponseHandler(404, 'User not found');
    }
    res.send({
      message: 'User found',
      statusCode: 200,
      user,
    });
  } catch (err) {
    next(err);
  }
}
