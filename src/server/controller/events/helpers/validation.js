import moment from 'moment';
import { isValidLatitude, isValidLongitude } from 'geolib';

import { ErrorResponseHandler } from '../../../../helpers/error';
import DATETIME_FORMAT from '../../../constants';

export function validateType(fieldName, fieldValue, expectedType) {
  switch (expectedType) {
    case 'string':
      if (typeof fieldValue !== 'string') {
        throw new ErrorResponseHandler(
          400,
          `Field ${fieldName} expected ${expectedType} received ${typeof fieldValue}`,
        );
      }
      break;
    case 'number':
      if (typeof fieldValue !== 'number') {
        throw new ErrorResponseHandler(
          400,
          `Field ${fieldName} expected ${expectedType} received ${typeof fieldValue}`,
        );
      }
      break;
    case 'boolean':
      if (typeof fieldValue !== 'boolean') {
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

function validatePrivacy(isPrivate) {
  validateType('isPrivate', isPrivate, 'boolean');
}

function validateStreamerDevice(streamerDevice) {
  validateType('streamerDevice', streamerDevice, 'string');
}

function validateLocation(latitude, longitude) {
  validateType('latitude', latitude, 'number');
  validateType('longitude', longitude, 'number');
  if (!isValidLatitude(latitude)) {
    throw new ErrorResponseHandler(400, 'Unknown latitude');
  }
  if (!isValidLongitude(longitude)) {
    throw new ErrorResponseHandler(400, 'Unknown longitude');
  }
}

function validateDates(startDate, endDate) {
  validateType('startDate', startDate, 'string');
  validateType('endDate', endDate, 'string');

  const allowedStartTime = moment().subtract(1, 'h').format(DATETIME_FORMAT);
  if (!(moment(startDate, DATETIME_FORMAT, true).isValid())) {
    throw new ErrorResponseHandler(400, 'Start date incorrectly formatted');
  }

  if (!(moment(endDate, DATETIME_FORMAT, true).isValid())) {
    throw new ErrorResponseHandler(400, 'End date incorrectly formatted');
  }

  if (moment(allowedStartTime).isAfter(startDate)) {
    throw new ErrorResponseHandler(400, 'The date cannot be in the past');
  }

  if (moment(startDate).add(1, 'h').isAfter(endDate)) {
    throw new ErrorResponseHandler(400, 'The end date must be > (startDate + 1 hour)');
  }

  if (moment(startDate).add(1, 'w').isBefore(endDate)) {
    throw new ErrorResponseHandler(400, 'The end date must be < (startDate + 1 week)');
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

export default function validateBody(body) {
  validateName(body.name);
  validateDescription(body.description);
  validateDates(body.startDate, body.endDate);
  validateLocation(body.latitude, body.longitude);
  validateStreamerDevice(body.streamerDevice);
  validatePrivacy(body.isPrivate);
}
