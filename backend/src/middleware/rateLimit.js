/**
 * Rate limiting middleware to protect API from abuse
 */
const rateLimit = require('express-rate-limit');

// Default rate limit configuration
const defaultRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: true,
    message: 'Too many requests, please try again later.'
  }
});

// Stricter limit for authentication routes (login, register)
const authRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 auth requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// Rate limit for export functionality
const exportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 export requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Too many export requests, please try again later.'
  }
});

module.exports = {
  defaultRateLimit,
  authRateLimit,
  exportRateLimit
};