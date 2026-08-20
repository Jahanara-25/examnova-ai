import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${role}/dashboard`);
    }
  }, [isAuthenticated, navigate, role]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const didLogin = login(role, email, password);
    if (!didLogin) {
      setError('Invalid credentials. Please use the role-based demo account shown below.');
    }
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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="error-message">{error}</p>}
          <button className="button button-primary" type="submit">
            Sign In
          </button>
        </form>
        <div className="demo-card">
          <h3>Demo credentials</h3>
          <p>Email: {role === 'student' ? 'student@examai.com' : role === 'teacher' ? 'teacher@examai.com' : 'admin@examai.com'}</p>
          <p>Password: {role === 'student' ? 'Student@123' : role === 'teacher' ? 'Teacher@123' : 'Admin@123'}</p>
        </div>
      </div>
    </main>
  );
}
