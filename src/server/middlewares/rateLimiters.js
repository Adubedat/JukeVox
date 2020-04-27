import rateLimit from 'express-rate-limit';

let rateLimitOpenRoutes = 1;
let rateLimitProtectedRoutes = 1;

if (process.env.NODE_ENV === 'production') {
  rateLimitOpenRoutes = 30;
  rateLimitProtectedRoutes = 60;
} else if (process.env.NODE_ENV === 'test') {
  rateLimitOpenRoutes = 3000;
  rateLimitProtectedRoutes = 6000;
}

export const openRoutesRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: rateLimitOpenRoutes,
  message: 'You have exceeded the 30 requests in 15 minutes limit!',
  headers: true,
});

export const loggedInRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute in miliseconds
  max: rateLimitProtectedRoutes,
  message: 'You have exceeded the 60 requests in 1 minute',
  headers: true,
});
