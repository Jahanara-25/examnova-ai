import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { api } from '../../lib/api';

const roleNames = { student: 'Student', teacher: 'Teacher' };

export default function ForgotPasswordPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  if (!roleNames[role]) return <main className="page-shell"><div className="container auth-card"><h1>Invalid password reset link</h1><Link to="/auth/role-selection">Return to sign in</Link></div></main>;

  const requestCode = async (event) => {
    event?.preventDefault();
    setError(''); setMessage(''); setBusy(true);
    try {
      const result = await api('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email, role }) });
      setMessage(result.message);
      setStep('otp'); setResendSeconds(60);
    } catch (requestError) {
      setError(requestError.message || 'Unable to request a reset code. Try again later.');
    } finally { setBusy(false); }
  };

  const verifyCode = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api('/auth/password-reset/verify', { method: 'POST', body: JSON.stringify({ email, role, otp }) });
      setResetToken(result.resetToken); setStep('password'); setMessage('Code verified. Choose a new password.');
    } catch (verifyError) { setError(verifyError.message || 'That code is invalid or expired.'); }
    finally { setBusy(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault(); setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8 || password.length > 128) { setError('Use a password between 8 and 128 characters.'); return; }
    setBusy(true);
    try {
      const result = await api('/auth/password-reset/reset', { method: 'POST', body: JSON.stringify({ email, role, resetToken, newPassword: password }) });
      setMessage(result.message); setStep('complete'); setPassword(''); setConfirmPassword(''); setOtp(''); setResetToken('');
    } catch (resetError) { setError(resetError.message || 'Unable to reset the password. Request a new code and try again.'); }
    finally { setBusy(false); }
  };

  return <main className="page-shell">
    <div className="container auth-card">
      <img className="auth-logo" src={logo} alt="ExamNova AI" />
      <p className="eyebrow">{roleNames[role]} account recovery</p>
      <h1>{step === 'complete' ? 'Password updated' : 'Forgot Password?'}</h1>
      {message && <p className="mt-3 text-sm text-cyan-400" role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      {step === 'email' && <form className="auth-form" onSubmit={requestCode}>
        <p>Enter the email address registered to your {roleNames[role].toLowerCase()} account. If eligible, reset instructions will be sent to that email. If nothing arrives after a few minutes, check spam or contact support because email delivery may be unavailable.</p>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Requesting…' : 'Send verification code'}</button>
      </form>}

      {step === 'otp' && <form className="auth-form" onSubmit={verifyCode}>
        <label>6-digit email code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required /></label>
        <button className="button button-primary" type="submit" disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : 'Verify code'}</button>
        <button className="button button-secondary" type="button" onClick={requestCode} disabled={busy || resendSeconds > 0}>{resendSeconds > 0 ? `Resend available in ${resendSeconds}s` : 'Resend code'}</button>
      </form>}

      {step === 'password' && <form className="auth-form" onSubmit={resetPassword}>
        <label>New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} required /></label>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Updating password…' : 'Reset password'}</button>
      </form>}

      {step === 'complete' && <button className="button button-primary mt-5 w-full" type="button" onClick={() => navigate(`/auth/login/${role}`, { replace: true, state: { message: 'Password reset successfully. Please sign in with your new password.' } })}>Return to {roleNames[role]} login</button>}
      {step !== 'complete' && <p className="mt-5 text-center text-sm text-slate-400"><Link to={`/auth/login/${role}`} className="font-semibold text-cyan-400">Back to {roleNames[role]} login</Link></p>}
    </div>
  </main>;
}
