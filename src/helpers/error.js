export class ErrorResponseHandler extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

export const handleError = (err, res) => {
  let { statusCode, message } = err;
  if (!statusCode || !message) {
    console.log(err);
    statusCode = 500;
    message = 'Internal server error';
  }
  res.status(statusCode).send({
    status: 'error',
    statusCode,
    message,
  });
};
