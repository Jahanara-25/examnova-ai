import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.svg';

const roleLabels = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
};

export default function LoginPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${user?.role || role}/dashboard`);
    }
  }, [isAuthenticated, navigate, role, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.ok) setError(result.message);
  };

  const roleLabel = roleLabels[role] || 'User';

  return (
    <main className="page-shell">
      <div className="container auth-card">
        <img className="auth-logo" src={logo} alt="ExamNova AI" />
        <p className="eyebrow">{roleLabel} login</p>
        <h1>Welcome back</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="relative block">
            Password
            <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-12" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-[2.1rem] rounded p-1 text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>{showPassword && <path strokeLinecap="round" d="m4 4 16 16"/>}</svg>
            </button>
          </label>
          {['student', 'teacher'].includes(role) && <p className="-mt-2 text-right text-sm"><Link to={`/auth/forgot-password/${role}`} className="font-semibold text-cyan-400">Forgot Password?</Link></p>}
          {error && <p className="error-message">{error}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        {role !== 'admin' && <p className="mt-5 text-center text-sm text-slate-400">Don&apos;t have an account? <Link to={`/register?role=${role}`} className="font-semibold text-cyan-400">Register</Link></p>}
      </div>
    </main>
  );
}
