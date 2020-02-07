import { checkUnknownFields } from '../../../helpers/validation';
import User from '../../models/userModel';
import { ErrorResponseHandler } from '../../../helpers/error';

export default async function searchForUser(req, res, next) {
  try {
    const possibleFilters = ['username', 'email'];
    checkUnknownFields(possibleFilters, req.query);

    const existingFilters = possibleFilters.filter((field) => req.query[field]);
    const values = existingFilters.map((filter) => (req.query[filter]));

    const response = await User.getUserProfile(existingFilters, values);
    if (response.length === 0) {
      throw new ErrorResponseHandler(404, 'No user found');
    }
    const user = response;

    res.send({
      message: 'Users found',
      data: user,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
