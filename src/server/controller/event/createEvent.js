import moment from 'moment';
import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';
import { checkUnknownFields } from '../../../helpers/validation';
import DATETIME_FORMAT from '../../constants';

function validateType(fieldName, fieldValue, expectedType) {
  switch (expectedType) {
    case 'string':
      if (typeof fieldValue !== 'string') {
        throw new ErrorResponseHandler(
          400,
          `Field ${fieldName} expected ${expectedType} received ${typeof fieldValue}`,
        );
      }
      break;
    default:
      throw new ErrorResponseHandler(400, 'Error parsing fields');
  }
}

function validateDates(startDate, endDate) {
  validateType('startDate', startDate, 'string');
  validateType('endDate', endDate, 'string');

  const allowedStartTime = moment().subtract(1, 'h').format(DATETIME_FORMAT);

  if (!(moment(startDate, DATETIME_FORMAT, true).isValid)
   || !(moment(endDate, DATETIME_FORMAT, true).isValid)) {
    throw new ErrorResponseHandler(400, 'The date is badly formatted');
  }

  if (moment(allowedStartTime).isAfter(startDate)) {
    throw new ErrorResponseHandler(400, 'The date cannot be in the past');
  }

  if (moment(startDate).add(1, 'h').isAfter(endDate)) {
    throw new ErrorResponseHandler(400, 'The end date must be > (startDate + 1 hour)');
  }
}

function validateDescription(description) {
  validateType('description', description, 'string');
  if (description.length > 2048) {
    throw new ErrorResponseHandler(400, 'Description is too long');
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
  validateDates(body.startDate, body.endDate);
}

export async function createEvent(req, res, next) {
  const { userId } = req.decoded;
  const acceptedFields = [
    'name',
    'description',
    'eventPicture',
    'startDate',
    'endDate',
    'latitude',
    'longitude',
    'streamerDevice',
    'isPrivate',
  ];
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

export async function getEvent(req, res, next) { }
