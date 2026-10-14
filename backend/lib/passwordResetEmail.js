const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;
const EMAIL_PATTERN = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

function senderAddress(value) {
  const configured = typeof value === 'string' ? value.trim() : '';
  const match = configured.match(/<\s*([^<>]+)\s*>\s*$/);
  const address = (match ? match[1] : configured).trim();
  return EMAIL_PATTERN.test(address) ? address : '';
}

function smtpConfiguration(env = process.env) {
  const host = typeof env.PASSWORD_RESET_SMTP_HOST === 'string' ? env.PASSWORD_RESET_SMTP_HOST.trim().toLowerCase() : '';
  const port = Number(env.PASSWORD_RESET_SMTP_PORT);
  const secure = typeof env.PASSWORD_RESET_SMTP_SECURE === 'string' ? env.PASSWORD_RESET_SMTP_SECURE.trim().toLowerCase() : '';
  const user = typeof env.PASSWORD_RESET_SMTP_USER === 'string' ? env.PASSWORD_RESET_SMTP_USER.trim() : '';
  const password = typeof env.PASSWORD_RESET_SMTP_APP_PASSWORD === 'string' ? env.PASSWORD_RESET_SMTP_APP_PASSWORD.trim() : '';
  const from = senderAddress(env.PASSWORD_RESET_FROM);

  if (!host || !env.PASSWORD_RESET_SMTP_PORT || !secure || !user || !password || !from) {
    return { configured: false, errorCode: 'smtp_configuration_incomplete' };
  }
  if (host !== SMTP_HOST || !Number.isInteger(port) || port !== SMTP_PORT || secure !== 'false') {
    return { configured: false, errorCode: 'smtp_configuration_invalid' };
  }
  if (!EMAIL_PATTERN.test(user) || user.toLowerCase() !== from.toLowerCase()) {
    return { configured: false, errorCode: 'smtp_sender_mismatch' };
  }

  return {
    configured: true,
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    user,
    password,
    from: `ExamNova AI Support <${from}>`,
  };
}

function isPasswordResetEmailConfigured(env = process.env) {
  return smtpConfiguration(env).configured;
}

function createPasswordResetEmail(otp) {
  const text = [
    'Hello,',
    '',
    'We received a request to reset your ExamNova AI account password.',
    '',
    `Your password reset OTP is: ${otp}`,
    '',
    'This OTP is valid for 10 minutes.',
    '',
    'If you did not request a password reset, please ignore this email.',
    'For your security, do not share this OTP with anyone.',
    '',
    'Regards,',
    'ExamNova AI Support',
  ].join('\n');
  const safeOtp = String(otp).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ExamNova AI password reset</title></head>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:24px 28px;background:#0f172a;color:#ffffff;font-size:20px;font-weight:700;">ExamNova AI</td></tr>
      <tr><td style="padding:28px;line-height:1.6;">
        <p style="margin:0 0 16px;">Hello,</p>
        <p style="margin:0 0 18px;">We received a request to reset your ExamNova AI account password.</p>
        <p style="margin:0 0 8px;">Your password reset OTP is:</p>
        <p style="margin:0 0 18px;padding:16px;text-align:center;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-size:30px;font-weight:700;letter-spacing:8px;">${safeOtp}</p>
        <p style="margin:0 0 18px;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="margin:0 0 18px;padding:12px;border-left:4px solid #f59e0b;background:#fffbeb;">If you did not request a password reset, please ignore this email. For your security, do not share this OTP with anyone.</p>
        <p style="margin:0;">Regards,<br><strong>ExamNova AI Support</strong></p>
      </td></tr>
    </table>
  </body>
</html>`;
  return { text, html };
}

function safeSmtpErrorCode(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  return /^[A-Za-z0-9_-]{2,40}$/.test(code) ? code : 'smtp_delivery_failed';
}

async function sendPasswordResetOtp({ to, otp }, { env = process.env, createTransport } = {}) {
  const config = smtpConfiguration(env);
  if (!config.configured) return { configured: false, accepted: false, providerErrorCode: config.errorCode };

  const content = createPasswordResetEmail(otp);
  try {
    const transportFactory = createTransport || require('nodemailer').createTransport;
    const transporter = transportFactory({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      auth: { user: config.user, pass: config.password },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject: 'ExamNova AI - Password Reset OTP',
      text: content.text,
      html: content.html,
    });
    const recipientAccepted = Array.isArray(info?.accepted)
      && info.accepted.some((recipient) => String(recipient).toLowerCase() === String(to).toLowerCase());
    if (!recipientAccepted) return { configured: true, accepted: false, providerErrorCode: 'smtp_recipient_not_accepted' };
    return { configured: true, accepted: true, provider: 'smtp' };
  } catch (error) {
    return { configured: true, accepted: false, providerErrorCode: safeSmtpErrorCode(error) };
  }
}

module.exports = { sendPasswordResetOtp, isPasswordResetEmailConfigured, createPasswordResetEmail };
