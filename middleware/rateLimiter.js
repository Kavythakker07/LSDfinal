const rateLimit = require("express-rate-limit");

/*
=====================================
OTP LIMITER
=====================================
*/

const otpLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 3, // only 3 requests in 2 mins
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 2 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/*
=====================================
LOGIN LIMITER
=====================================
*/

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // 10 login attempts
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  otpLimiter,
  loginLimiter
};