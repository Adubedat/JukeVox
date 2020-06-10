import logger from './logger';

export class ErrorResponseHandler extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

export const handleError = (err, req, res) => {
  let { statusCode, message } = err;
  if (!statusCode || !message) {
    logger.error(err, { userAgent: req.get('user-agent') });
    statusCode = 500;
    message = 'Internal server error';
  } else {
    logger.error('code: %s, message: %s', err.statusCode, err.message, { userAgent: req.get('user-agent') });
  }
  res.status(statusCode).send({
    status: 'error',
    statusCode,
    message,
  });
};
