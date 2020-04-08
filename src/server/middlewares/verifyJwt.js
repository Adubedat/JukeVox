import jwt from 'jsonwebtoken';
import { ErrorResponseHandler } from '../../helpers/error';
import User from '../models/userModel';

export default async function verifyJwt(req, res, next) {
  try {
    if (!req.headers.authorization) {
      throw new ErrorResponseHandler(401, 'Authorization token is missing');
    }
    const token = req.headers.authorization.substr(7);

    if (token.length > 0) {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        throw new ErrorResponseHandler(401, 'Invalid authorization token');
      }

      const { userId } = decoded;
      const [user] = await User.getUserProfile(['Id'], [userId]);
      if (user === undefined || user.Username === null) {
        throw new ErrorResponseHandler(401, 'Invalid authorization token');
      }
      req.decoded = decoded;
      next();
    }
  } catch (err) {
    next(err);
  }
}
