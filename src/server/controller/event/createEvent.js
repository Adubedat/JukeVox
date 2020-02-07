import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';

function validateType(fieldName, fieldValue, expectedType) {
  if (typeof fieldValue !== 'string') {
    throw new ErrorResponseHandler(400, `Field ${fieldName} expected ${expectedType} received ${typeof fieldValue}`);
  }
}

function validateDescription(description) {
  if (description.length > 2048) {
    throw new ErrorResponseHandler(400, 'Description too long');
  }
}

function validateName(name) {
  validateType('name', name, 'string');
  if (name.length > 100) {
    throw new ErrorResponseHandler(400, 'Name is too long');
  }
}

function validateBody(body) {
  validateName(body.name);
  validateDescription(body.description);
}

export async function createEvent(req, res, next) {
  const { userId } = req.decoded;
  const acceptedFields = ['name', 'description', 'eventPicture',
    'startDate', 'endDate', 'latitude', 'longitude', 'streamerDevice', 'isPrivate'];
  try {
    checkUnknownFields(acceptedFields, req.body);

    // TODO: verify all fields in req.body are correct
    validateBody(req.body);


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
