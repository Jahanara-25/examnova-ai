import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
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
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        {location.state?.message && <p className="mt-3 text-sm font-semibold text-emerald-400" role="status">{location.state.message}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
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
