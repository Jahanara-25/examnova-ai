const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const PasswordResetChallenge = require('../models/passwordResetChallenge');
const User = require('../models/user');
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
const { sendPasswordResetOtp, isPasswordResetEmailConfigured, createPasswordResetEmail } = require('../lib/passwordResetEmail');
const passwordResetRoutes = require('../routes/passwordResetRoutes');

const validSmtpEnv = (overrides = {}) => ({
  PASSWORD_RESET_SMTP_HOST: 'smtp.gmail.com',
  PASSWORD_RESET_SMTP_PORT: '587',
  PASSWORD_RESET_SMTP_SECURE: 'false',
  PASSWORD_RESET_SMTP_USER: 'sender@gmail.com',
  PASSWORD_RESET_SMTP_APP_PASSWORD: 'test-app-password',
  PASSWORD_RESET_FROM: 'ExamNova AI Support <sender@gmail.com>',
  ...overrides,
});

test('password reset codes and reset tokens use secure expected formats', () => {
  for (let count = 0; count < 20; count += 1) assert.match(createOtp(), /^\d{6}$/);
  const token = createResetToken();
  assert.ok(token.length >= 40);
  assert.notEqual(hashResetToken(token), token);
  assert.equal(hashResetToken(token), hashResetToken(token));
});

test('password reset policy preserves role-safe email, expiry, attempt, and password limits', () => {
  assert.equal(normalizeEmail('  Student@Example.com '), 'student@example.com');
  assert.equal(isValidEmail('student@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidNewPassword('12345678'), true);
  assert.equal(isValidNewPassword('short'), false);
  assert.equal(isValidNewPassword('x'.repeat(129)), false);
  assert.equal(OTP_TTL_MS, 10 * 60 * 1000);
  assert.equal(RESET_TOKEN_TTL_MS, 10 * 60 * 1000);
  assert.equal(RESEND_COOLDOWN_MS, 60 * 1000);
  assert.equal(MAX_OTP_ATTEMPTS, 5);
});

test('password reset email uses ExamNova AI Support branding and matching text and HTML', () => {
  const content = createPasswordResetEmail('048216');
  assert.match(content.text, /ExamNova AI/);
  assert.match(content.html, /ExamNova AI/);
  assert.match(content.text, /048216/);
  assert.match(content.html, /048216/);
  assert.match(content.text, /valid for 10 minutes/);
  assert.match(content.html, /valid for <strong>10 minutes<\/strong>/);
  assert.match(content.text, /If you did not request a password reset/);
  assert.match(content.html, /If you did not request a password reset/);
  assert.match(content.text, /do not share this OTP/i);
  assert.match(content.html, /do not share this OTP/i);
  assert.match(content.text, /ExamNova AI Support/);
  assert.match(content.html, /ExamNova AI Support/);
});

test('only complete Gmail SMTP configuration enables password reset email', () => {
  assert.equal(isPasswordResetEmailConfigured(validSmtpEnv()), true);
  assert.equal(isPasswordResetEmailConfigured(validSmtpEnv({ RESEND_API_KEY: undefined })), true);
  assert.equal(isPasswordResetEmailConfigured({
    RESEND_API_KEY: 'resend-test-key',
    PASSWORD_RESET_FROM: 'ExamNova AI Support <sender@gmail.com>',
  }), false);

  for (const key of [
    'PASSWORD_RESET_SMTP_HOST',
    'PASSWORD_RESET_SMTP_PORT',
    'PASSWORD_RESET_SMTP_SECURE',
    'PASSWORD_RESET_SMTP_USER',
    'PASSWORD_RESET_SMTP_APP_PASSWORD',
    'PASSWORD_RESET_FROM',
  ]) {
    assert.equal(isPasswordResetEmailConfigured(validSmtpEnv({ [key]: '' })), false, `${key} must be required`);
  }
  assert.equal(isPasswordResetEmailConfigured(validSmtpEnv({ PASSWORD_RESET_SMTP_PORT: '2525' })), false);
  assert.equal(isPasswordResetEmailConfigured(validSmtpEnv({ PASSWORD_RESET_SMTP_PORT: '587abc' })), false);
  assert.equal(isPasswordResetEmailConfigured(validSmtpEnv({ PASSWORD_RESET_SMTP_HOST: 'smtp.example.com' })), false);
  assert.equal(isPasswordResetEmailConfigured(validSmtpEnv({ PASSWORD_RESET_SMTP_SECURE: 'true' })), false);
  assert.equal(isPasswordResetEmailConfigured(validSmtpEnv({ PASSWORD_RESET_FROM: 'ExamNova AI Support <other@gmail.com>' })), false);
});

test('SMTP send uses STARTTLS, the branded sender, and provider acceptance without sending a real email', async () => {
  let captured;
  const result = await sendPasswordResetOtp({ to: 'student@example.com', otp: '123456' }, {
    env: validSmtpEnv(),
    createTransport: (options) => ({
      sendMail: async (message) => {
        captured = { options, message };
        return { accepted: [message.to], rejected: [] };
      },
    }),
  });

  assert.deepEqual(result, { configured: true, accepted: true, provider: 'smtp' });
  assert.equal(captured.options.host, 'smtp.gmail.com');
  assert.equal(captured.options.port, 587);
  assert.equal(captured.options.secure, false);
  assert.equal(captured.options.requireTLS, true);
  assert.equal(captured.options.auth.user, 'sender@gmail.com');
  assert.equal(captured.options.connectionTimeout, 10000);
  assert.equal(captured.options.greetingTimeout, 10000);
  assert.equal(captured.options.socketTimeout, 15000);
  assert.equal(captured.message.from, 'ExamNova AI Support <sender@gmail.com>');
  assert.equal(captured.message.to, 'student@example.com');
  assert.equal(captured.message.subject, 'ExamNova AI - Password Reset OTP');
  assert.match(captured.message.text, /123456/);
  assert.match(captured.message.html, /123456/);
});

test('SMTP authentication and connection failures are safe and never fall back to Resend', async () => {
  const originalFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; throw new Error('unexpected network fallback'); };
  try {
    for (const code of ['EAUTH', 'ECONNECTION']) {
      const result = await sendPasswordResetOtp({ to: 'teacher@example.com', otp: '654321' }, {
        env: validSmtpEnv({ RESEND_API_KEY: 'resend-must-not-be-used' }),
        createTransport: () => ({ sendMail: async () => { const error = new Error('private SMTP details'); error.code = code; throw error; } }),
      });
      assert.deepEqual(result, { configured: true, accepted: false, providerErrorCode: code });
      assert.doesNotMatch(JSON.stringify(result), /test-app-password|resend-must-not-be-used|654321|private SMTP details/);
    }
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('SMTP send rejection does not report success when the recipient was not accepted', async () => {
  const result = await sendPasswordResetOtp({ to: 'student@example.com', otp: '111222' }, {
    env: validSmtpEnv(),
    createTransport: () => ({ sendMail: async () => ({ accepted: [], rejected: ['student@example.com'] }) }),
  });
  assert.deepEqual(result, { configured: true, accepted: false, providerErrorCode: 'smtp_recipient_not_accepted' });
});

const app = express();
app.use(express.json());
app.use('/api/auth/password-reset', passwordResetRoutes);
let server;
let baseUrl;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api/auth/password-reset`;
});
after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

function challengeMatches(challenge, query) {
  if (!challenge) return false;
  if (query._id && String(challenge._id) !== String(query._id)) return false;
  if (query.email && challenge.email !== query.email) return false;
  if (query.role && challenge.role !== query.role) return false;
  if (query.status && challenge.status !== query.status) return false;
  if (query.otpHash && typeof query.otpHash === 'string' && challenge.otpHash !== query.otpHash) return false;
  if (query.otpHash?.$ne !== undefined && challenge.otpHash === query.otpHash.$ne) return false;
  if (query.userId?.$ne !== undefined && challenge.userId === query.userId.$ne) return false;
  if (query.expiresAt?.$gt && !(challenge.expiresAt > query.expiresAt.$gt)) return false;
  if (query.resetTokenExpiresAt?.$gt && !(challenge.resetTokenExpiresAt > query.resetTokenExpiresAt.$gt)) return false;
  if (query.attempts?.$lt !== undefined && !(challenge.attempts < query.attempts.$lt)) return false;
  if (query.resetTokenHash && challenge.resetTokenHash !== query.resetTokenHash) return false;
  if (query.resendAfter?.$lte && !(challenge.resendAfter <= query.resendAfter.$lte)) return false;
  return true;
}

test('student and teacher request, verify, and reset use SMTP while preserving OTP security', { concurrency: false }, async () => {
  const challengeMethods = {
    findOne: PasswordResetChallenge.findOne,
    create: PasswordResetChallenge.create,
    findOneAndUpdate: PasswordResetChallenge.findOneAndUpdate,
    updateOne: PasswordResetChallenge.updateOne,
  };
  const userMethods = { findOne: User.findOne, updateOne: User.updateOne };
  const originalCreateTransport = nodemailer.createTransport;
  const envKeys = [
    'PASSWORD_RESET_SMTP_HOST', 'PASSWORD_RESET_SMTP_PORT', 'PASSWORD_RESET_SMTP_SECURE',
    'PASSWORD_RESET_SMTP_USER', 'PASSWORD_RESET_SMTP_APP_PASSWORD', 'PASSWORD_RESET_FROM', 'RESEND_API_KEY',
  ];
  const oldEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const challenges = new Map();
  const sentMessages = [];
  const userUpdates = [];
  const accounts = [
    { _id: 'student-user', email: 'student@example.com', role: 'student' },
    { _id: 'teacher-user', email: 'teacher@example.com', role: 'teacher' },
    { _id: 'legacy-student-user', email: 'Legacy.Student@Example.com', role: 'student' },
    { _id: 'delivery-failure-user', email: 'delivery-failure@example.com', role: 'teacher' },
  ];
  let failSmtp = false;
  const challengeKey = (email, role) => `${email}:${role}`;

  Object.assign(process.env, validSmtpEnv({ RESEND_API_KEY: 'obsolete-resend-key' }));
  PasswordResetChallenge.findOne = async (query) => {
    const challenge = challenges.get(challengeKey(query.email, query.role));
    return challengeMatches(challenge, query) ? challenge : null;
  };
  PasswordResetChallenge.create = async (values) => {
    const challenge = { _id: `${values.role}-${values.email}`, ...values };
    challenges.set(challengeKey(values.email, values.role), challenge);
    return challenge;
  };
  PasswordResetChallenge.findOneAndUpdate = async (query, update) => {
    const challenge = [...challenges.values()].find((entry) => challengeMatches(entry, query));
    if (!challenge) return null;
    Object.assign(challenge, update.$set || {});
    for (const key of Object.keys(update.$unset || {})) delete challenge[key];
    return challenge;
  };
  PasswordResetChallenge.updateOne = async (query, update) => {
    const challenge = [...challenges.values()].find((entry) => challengeMatches(entry, query));
    if (!challenge) return { modifiedCount: 0 };
    if (Array.isArray(update)) {
      challenge.attempts += 1;
      if (challenge.attempts >= MAX_OTP_ATTEMPTS) challenge.status = 'locked';
    } else {
      Object.assign(challenge, update.$set || {});
      for (const key of Object.keys(update.$unset || {})) delete challenge[key];
    }
    return { modifiedCount: 1 };
  };
  const matchesEmail = (account, emailQuery) => {
    if (typeof emailQuery === 'string') return account.email === emailQuery;
    if (emailQuery?.$regex) return new RegExp(emailQuery.$regex, emailQuery.$options).test(account.email);
    return false;
  };
  User.findOne = (query) => ({ select: async () => accounts.find((account) => account.role === query.role && matchesEmail(account, query.email)) || null });
  User.updateOne = async (query, update) => {
    userUpdates.push({ query, update });
    return { matchedCount: accounts.some((account) => account._id === query._id && account.role === query.role && matchesEmail(account, query.email)) ? 1 : 0 };
  };
  nodemailer.createTransport = (options) => ({
    sendMail: async (message) => {
      if (failSmtp) { const error = new Error('private SMTP authentication detail'); error.code = 'EAUTH'; throw error; }
      sentMessages.push({ options, message });
      return { accepted: [message.to], rejected: [] };
    },
  });

  try {
    for (const role of ['student', 'teacher']) {
      const email = `${role}@example.com`;
      const requested = await fetch(`${baseUrl}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
      assert.equal(requested.status, 202);
      const requestBody = await requested.json();
      assert.match(requestBody.message, /If an eligible account matches that email/);
      const message = sentMessages.at(-1).message;
      assert.equal(message.to, email);
      assert.equal(sentMessages.at(-1).options.host, 'smtp.gmail.com');
      assert.doesNotMatch(message.text, /obsolete-resend-key/);
      const otp = message.text.match(/password reset OTP is: (\d{6})/)?.[1];
      assert.ok(otp);

      const verified = await fetch(`${baseUrl}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role, otp }) });
      assert.equal(verified.status, 200);
      const { resetToken } = await verified.json();
      const challenge = challenges.get(challengeKey(email, role));
      assert.equal(challenge.status, 'verified');
      assert.equal(challenge.otpHash, undefined);
      assert.ok(challenge.resetTokenExpiresAt - Date.now() <= RESET_TOKEN_TTL_MS);

      const reset = await fetch(`${baseUrl}/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role, resetToken, newPassword: 'NewSecurePass123' }) });
      assert.equal(reset.status, 200);
      assert.equal(challenge.status, 'used');
      assert.equal(challenge.resetTokenHash, undefined);
      assert.match(userUpdates.at(-1).update.$set.password, /^\$2/);
      assert.equal(userUpdates.at(-1).query.role, role);

      const reuse = await fetch(`${baseUrl}/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role, resetToken, newPassword: 'AnotherSecurePass123' }) });
      assert.equal(reuse.status, 400);
    }

    const legacyEmail = 'legacy.student@example.com';
    const legacyRequested = await fetch(`${baseUrl}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: legacyEmail, role: 'student' }) });
    assert.equal(legacyRequested.status, 202);
    const legacyMessage = sentMessages.at(-1).message;
    assert.equal(legacyMessage.to, 'Legacy.Student@Example.com');
    const legacyOtp = legacyMessage.text.match(/password reset OTP is: (\d{6})/)?.[1];
    assert.ok(legacyOtp);
    const legacyVerified = await fetch(`${baseUrl}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: legacyEmail, role: 'student', otp: legacyOtp }) });
    assert.equal(legacyVerified.status, 200);
    const { resetToken: legacyResetToken } = await legacyVerified.json();
    const legacyReset = await fetch(`${baseUrl}/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: legacyEmail, role: 'student', resetToken: legacyResetToken, newPassword: 'NewSecurePass123' }) });
    assert.equal(legacyReset.status, 200);
    assert.equal(userUpdates.at(-1).query._id, 'legacy-student-user');

    const sentBeforeUnknown = sentMessages.length;
    const knownBody = await (await fetch(`${baseUrl}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'unknown@example.com', role: 'student' }) })).json();
    assert.equal(knownBody.message, 'If an eligible account matches that email, reset instructions will be sent. Check your inbox shortly; if nothing arrives, wait briefly and try again.');
    assert.equal(sentMessages.length, sentBeforeUnknown);
    const invalidRole = await fetch(`${baseUrl}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', role: 'admin' }) });
    assert.equal(invalidRole.status, 202);
    assert.equal((await invalidRole.json()).message, knownBody.message);

    const expired = { _id: 'expired-student', email: 'expired@example.com', role: 'student', userId: 'student-user', status: 'pending', otpHash: await bcrypt.hash('123456', 10), attempts: 0, expiresAt: new Date(Date.now() - 1000) };
    challenges.set(challengeKey(expired.email, expired.role), expired);
    const expiredResponse = await fetch(`${baseUrl}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: expired.email, role: expired.role, otp: '123456' }) });
    assert.equal(expiredResponse.status, 400);
    assert.equal(expired.attempts, 0);

    const limited = { _id: 'limited-student', email: 'limited@example.com', role: 'student', userId: 'student-user', status: 'pending', otpHash: await bcrypt.hash('123456', 10), attempts: 0, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
    challenges.set(challengeKey(limited.email, limited.role), limited);
    for (let attempt = 0; attempt < MAX_OTP_ATTEMPTS; attempt += 1) {
      const response = await fetch(`${baseUrl}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: limited.email, role: limited.role, otp: '000000' }) });
      assert.equal(response.status, 400);
    }
    assert.equal(limited.attempts, MAX_OTP_ATTEMPTS);
    assert.equal(limited.status, 'locked');

    failSmtp = true;
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args);
    try {
      const failed = await fetch(`${baseUrl}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'delivery-failure@example.com', role: 'teacher' }) });
      assert.equal(failed.status, 503);
      const body = await failed.json();
      assert.match(body.message, /Gmail SMTP could not accept/);
      assert.doesNotMatch(JSON.stringify(body), /EAUTH|private SMTP|test-app-password|delivery-failure@example.com/);
      assert.doesNotMatch(JSON.stringify(warnings), /private SMTP|test-app-password|delivery-failure@example.com|\d{6}/);
      assert.equal(challenges.get(challengeKey('delivery-failure@example.com', 'teacher')).status, 'delivery-failed');
    } finally {
      console.warn = originalWarn;
      failSmtp = false;
    }
  } finally {
    PasswordResetChallenge.findOne = challengeMethods.findOne;
    PasswordResetChallenge.create = challengeMethods.create;
    PasswordResetChallenge.findOneAndUpdate = challengeMethods.findOneAndUpdate;
    PasswordResetChallenge.updateOne = challengeMethods.updateOne;
    User.findOne = userMethods.findOne;
    User.updateOne = userMethods.updateOne;
    nodemailer.createTransport = originalCreateTransport;
    for (const key of envKeys) {
      if (oldEnv[key] === undefined) delete process.env[key];
      else process.env[key] = oldEnv[key];
    }
  }
});
