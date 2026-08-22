import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../common/ThemeToggle';

export default function TopNavbar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between rounded-[24px] border border-blue-400/20 bg-slate-900/60 p-4 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">{role === 'teacher' ? 'Teacher Console' : 'Student Portal'}</p>
        <h2 className="text-lg font-semibold text-slate-100">Welcome back, {user?.name || 'Learner'}</h2>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <label className="hidden items-center gap-2 rounded-2xl border border-blue-400/20 bg-slate-950/40 px-3 py-2 text-sm text-slate-400 md:flex">
          <FaSearch />
          <input className="w-32 border-none bg-transparent text-slate-100 outline-none placeholder:text-slate-500" placeholder="Search" />
        </label>
        <button onClick={() => navigate(role === 'teacher' ? '/teacher/notifications' : '/student/notifications')} aria-label="Open notifications" className="rounded-2xl border border-blue-400/20 bg-slate-950/30 p-2.5 text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300">
          <FaBell />
        </button>
        <button onClick={() => navigate(role === 'teacher' ? '/teacher/profile' : '/student/profile')} className="flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-slate-950/30 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-purple-400/50 hover:bg-purple-400/10">
          <FaUserCircle />
          <span>{user?.name || 'Profile'}</span>
        </button>
        <button onClick={logout} className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-blue-950/50 transition hover:-translate-y-0.5 hover:shadow-purple-500/30">Logout</button>
      </div>
    </header>
  );
}
