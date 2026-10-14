const express = require('express');
const bcrypt = require('bcryptjs');
const PasswordResetChallenge = require('../models/passwordResetChallenge');
const User = require('../models/user');
const { sendPasswordResetOtp, isPasswordResetEmailConfigured } = require('../lib/passwordResetEmail');
const {
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
} = require('../lib/passwordReset');

const router = express.Router();
const GENERIC_REQUEST_MESSAGE = 'If an eligible account matches that email, reset instructions will be sent. Check your inbox shortly; if nothing arrives, wait briefly and try again.';
const ipWindows = new Map();
const IP_WINDOW_MS = 15 * 60 * 1000;

function caseInsensitiveEmailQuery(email) {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: `^${escapedEmail}$`, $options: 'i' };
}

function rateLimited(req, action, maxRequests) {
  const now = Date.now();
  for (const [key, entry] of ipWindows) if (entry.expiresAt <= now) ipWindows.delete(key);
  const key = `${action}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  const entry = ipWindows.get(key);
  if (!entry || entry.expiresAt <= now) {
    ipWindows.set(key, { count: 1, expiresAt: now + IP_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > maxRequests;
}

router.post('/request', async (req, res) => {
  if (rateLimited(req, 'request', 8)) return res.status(429).json({ message: 'Too many reset requests. Wait 15 minutes and try again.' });
  if (!isPasswordResetEmailConfigured()) {
    return res.status(503).json({ message: 'Password reset email is not configured. Set the Gmail SMTP host, port, secure mode, username, App Password, and sender in backend/.env, then restart the backend.' });
  }
  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role;
  if (!isValidEmail(email) || !['student', 'teacher'].includes(role)) return res.status(202).json({ message: GENERIC_REQUEST_MESSAGE });
  const now = new Date();
  let challenge;
  try {
    const existing = await PasswordResetChallenge.findOne({ email, role });
    if (existing?.resendAfter > now) {
      if (existing.status === 'delivery-failed') {
        return res.status(503).json({ message: 'Gmail SMTP could not accept the password reset email. Check the SMTP settings and try again later.' });
      }
      return res.status(202).json({ message: GENERIC_REQUEST_MESSAGE });
    }

    let user = await User.findOne({ email, role }).select('_id email role');
    if (!user) user = await User.findOne({ email: caseInsensitiveEmailQuery(email), role }).select('_id email role');
    const otp = user ? createOtp() : null;
    const otpHash = otp ? await bcrypt.hash(otp, 10) : null;
    const values = {
      userId: user?._id || null,
      otpHash,
      status: 'pending',
      attempts: 0,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      resendAfter: new Date(now.getTime() + RESEND_COOLDOWN_MS),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    };

    if (existing) {
      challenge = await PasswordResetChallenge.findOneAndUpdate(
        { _id: existing._id, resendAfter: { $lte: now } },
        { $set: values },
        { new: true },
      );
      if (!challenge) return res.status(202).json({ message: GENERIC_REQUEST_MESSAGE });
    } else {
      try { challenge = await PasswordResetChallenge.create({ email, role, ...values }); }
      catch (error) {
        if (error.code === 11000) return res.status(202).json({ message: GENERIC_REQUEST_MESSAGE });
        throw error;
      }
    }

    if (user && otp) {
      try {
        const delivery = await sendPasswordResetOtp({ to: user.email, otp });
        if (!delivery.configured || !delivery.accepted) {
          await PasswordResetChallenge.updateOne({ _id: challenge._id }, { $set: { status: 'delivery-failed', otpHash: null, userId: null } });
          console.warn('Password reset email delivery failed', {
            provider: 'smtp',
            code: delivery.providerErrorCode || 'smtp_delivery_failed',
          });
          return res.status(503).json({ message: 'Gmail SMTP could not accept the password reset email. Check the SMTP settings and try again later.' });
        }
      } catch (error) {
        await PasswordResetChallenge.updateOne({ _id: challenge._id }, { $set: { status: 'delivery-failed', otpHash: null, userId: null } });
        console.warn('Password reset email delivery failed', { provider: 'smtp', errorCode: 'smtp_delivery_failed' });
        return res.status(503).json({ message: 'Gmail SMTP could not accept the password reset email. Check the SMTP settings and try again later.' });
      }
    }

    return res.status(202).json({ message: GENERIC_REQUEST_MESSAGE });
  } catch (error) {
    console.error('Password reset request could not be processed', { errorName: error?.name || 'Error', errorCode: error?.code || 'unknown' });
    return res.status(503).json({ message: 'Password reset is temporarily unavailable. Please try again later.' });
  }
});

router.post('/verify', async (req, res) => {
  if (rateLimited(req, 'verify', 20)) return res.status(429).json({ message: 'Too many verification attempts. Wait 15 minutes and try again.' });
  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role;
  const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
  if (!isValidEmail(email) || !['student', 'teacher'].includes(role) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'That code is invalid or expired. Request a new code and try again.' });
  }

  try {
    const now = new Date();
    const challenge = await PasswordResetChallenge.findOne({ email, role, status: 'pending', expiresAt: { $gt: now }, attempts: { $lt: MAX_OTP_ATTEMPTS }, otpHash: { $ne: null }, userId: { $ne: null } });
    if (!challenge || !await bcrypt.compare(otp, challenge.otpHash)) {
      await PasswordResetChallenge.updateOne(
        { email, role, status: 'pending', expiresAt: { $gt: now }, attempts: { $lt: MAX_OTP_ATTEMPTS } },
        [{ $set: { attempts: { $add: ['$attempts', 1] }, status: { $cond: [{ $gte: [{ $add: ['$attempts', 1] }, MAX_OTP_ATTEMPTS] }, 'locked', '$status'] } } }],
      );
      return res.status(400).json({ message: 'That code is invalid or expired. Request a new code and try again.' });
    }

    const resetToken = createResetToken();
    const updated = await PasswordResetChallenge.findOneAndUpdate(
      { _id: challenge._id, status: 'pending', otpHash: challenge.otpHash, expiresAt: { $gt: now }, attempts: { $lt: MAX_OTP_ATTEMPTS } },
      { $set: { status: 'verified', expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS), resetTokenHash: hashResetToken(resetToken), resetTokenExpiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS) }, $unset: { otpHash: 1 } },
      { new: true },
    );
    if (!updated) return res.status(400).json({ message: 'That code is invalid or expired. Request a new code and try again.' });
    return res.json({ resetToken });
  } catch {
    return res.status(503).json({ message: 'Verification is temporarily unavailable. Please try again.' });
  }
});

router.post('/reset', async (req, res) => {
  if (rateLimited(req, 'reset', 20)) return res.status(429).json({ message: 'Too many reset attempts. Wait 15 minutes and try again.' });
  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role;
  const resetToken = typeof req.body?.resetToken === 'string' ? req.body.resetToken : '';
  const newPassword = req.body?.newPassword;
  if (!isValidEmail(email) || !['student', 'teacher'].includes(role) || !resetToken || !isValidNewPassword(newPassword)) {
    return res.status(400).json({ message: 'Enter a new password of at least 8 characters after verifying your code.' });
  }

  try {
    const now = new Date();
    const challenge = await PasswordResetChallenge.findOneAndUpdate(
      { email, role, status: 'verified', resetTokenHash: hashResetToken(resetToken), resetTokenExpiresAt: { $gt: now }, userId: { $ne: null } },
      { $set: { status: 'resetting' } },
      { new: true },
    );
    if (!challenge) return res.status(400).json({ message: 'Your reset session expired or was already used. Request a new code.' });

    const password = await bcrypt.hash(newPassword, 12);
    const result = await User.updateOne({ _id: challenge.userId, email: caseInsensitiveEmailQuery(email), role }, { $set: { password } });
    if (result.matchedCount !== 1) {
      await PasswordResetChallenge.updateOne({ _id: challenge._id, status: 'resetting' }, { $set: { status: 'used' }, $unset: { resetTokenHash: 1 } });
      return res.status(400).json({ message: 'The account could not be reset. Request a new code.' });
    }
    await PasswordResetChallenge.updateOne(
      { _id: challenge._id, status: 'resetting' },
      { $set: { status: 'used' }, $unset: { otpHash: 1, resetTokenHash: 1, resetTokenExpiresAt: 1 } },
    );
    return res.json({ message: 'Password reset successfully. Sign in with your new password.' });
  } catch {
    return res.status(503).json({ message: 'Password reset is temporarily unavailable. Please try again.' });
  }
});

module.exports = router;
