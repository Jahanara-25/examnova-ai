import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import logo from '../../assets/logo.svg';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const validRoles = ['student', 'teacher'];

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(validRoles.includes(searchParams.get('role')) ? searchParams.get('role') : 'student');
  const [form, setForm] = useState({ name: '', email: '', rollNumber: '', department: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) return setError('Please complete every field.');
    if (role === 'student' && (!form.rollNumber.trim() || !form.department.trim())) return setError('Roll number and department are required for student registration.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (form.password !== form.confirmPassword) return setError('Password and confirm password must match.');

    setIsSubmitting(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role, ...(role === 'student' ? { rollNumber: form.rollNumber, department: form.department } : {}) };
      const response = await fetch(`${apiBaseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setError(response.status >= 500 ? 'Authentication server error. Please try again.' : data.message || 'Registration failed.');
      navigate(`/auth/login/${role}`, { replace: true });
    } catch {
      setError('Unable to reach the authentication service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="page-shell"><div className="container auth-card">
    <img className="auth-logo" src={logo} alt="ExamNova AI" />
    <p className="eyebrow">Create your account</p><h1>Join ExamNova AI</h1>
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <fieldset><legend className="mb-2 font-semibold">I am registering as:</legend><div className="flex flex-wrap gap-3">{validRoles.map((item) => <button key={item} type="button" onClick={() => setRole(item)} className={`button ${role === item ? 'button-primary' : 'button-secondary'}`}>{item === 'student' ? 'Student' : 'Teacher'}</button>)}</div></fieldset>
      <label>Name<input name="name" value={form.name} onChange={update} autoComplete="name" /></label>
      <label>Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" /></label>
      {role === 'student' && <><label>Roll Number<input name="rollNumber" value={form.rollNumber} onChange={update} autoComplete="off" /></label><label>Department<input name="department" value={form.department} onChange={update} autoComplete="organization" /></label></>}
      <label className="relative block">Password<input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update} autoComplete="new-password" className="pr-12" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-[2.1rem] rounded p-1 text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>{showPassword && <path strokeLinecap="round" d="m4 4 16 16"/>}</svg></button></label>
      <label className="relative block">Confirm Password<input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={update} autoComplete="new-password" className="pr-12" /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={showConfirmPassword} className="absolute right-3 top-[2.1rem] rounded p-1 text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>{showConfirmPassword && <path strokeLinecap="round" d="m4 4 16 16"/>}</svg></button></label>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create Account'}</button>
    </form>
    <p className="mt-5 text-center text-sm text-slate-400">Already have an account? <Link to={`/auth/login/${role}`} className="font-semibold text-cyan-400">Sign In</Link></p>
  </div></main>;
}
