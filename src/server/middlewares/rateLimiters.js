import rateLimit from 'express-rate-limit';

export const openRoutesRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 30,
  message: 'You have exceeded the 30 requests in 15 minutes limit!',
  headers: true,
});

export const loggedInRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute in miliseconds
  max: 60,
  message: 'You have exceeded the 60 requests in 1 minute',
  headers: true,
});
