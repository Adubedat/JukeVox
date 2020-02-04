import jwt from 'jsonwebtoken';
import { ErrorResponseHandler } from '../../helpers/error';

const verifyJwt = (req, res, next) => {
  if (!req.headers.authorization) {
    throw new ErrorResponseHandler(401, 'No token provided');
  }
  const token = req.headers.authorization.substr(7);

  if (token.length > 0) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        throw new ErrorResponseHandler(401, 'Invalid token');
      }
      req.decoded = decoded;
      return next();
    });
  }
};

export default verifyJwt;
