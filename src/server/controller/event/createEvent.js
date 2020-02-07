import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';

function validateDescription(description) {
  if (description.length > 2048) {
    throw new ErrorResponseHandler(400, 'Description too long');
  }
}

function validateName(name) {
  if (name.length > 100) {
    throw new ErrorResponseHandler(400, 'Name too long');
  }
}

function validateBody(body) {
  validateName(body.name);
  validateDescription(body.description);
}

export async function createEvent(req, res, next) {
  const { userId } = req.decoded;
  try {
    // TODO: verify all fields in req.body are correct
    validateBody(req.body);

    // TODO: check if any unknown fields in req.body
    await Event.createNewEvent(userId, req.body);
    // TODO: Create a user in eventGuest with the userId
    res.status(200).send({
      statusCode: 200,
      message: 'Event successfully created!',
      data: req.body,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req, res, next) {

}
