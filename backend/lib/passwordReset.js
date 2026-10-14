const crypto = require('crypto');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(value) {
  return value.length <= 254 && /^\S+@\S+\.\S+$/.test(value);
}

function createOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function createResetToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isValidNewPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

module.exports = {
  OTP_TTL_MS,
  RESET_TOKEN_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_OTP_ATTEMPTS,
  normalizeEmail,
  isValidEmail,
  createOtp,
  createResetToken,
  hashResetToken,
  isValidNewPassword,
};
