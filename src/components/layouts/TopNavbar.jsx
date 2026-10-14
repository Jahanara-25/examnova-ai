import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaBell, FaSearch, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../common/ThemeToggle';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const studentPages = [
  { label: 'Dashboard', path: '/student/dashboard' },
  { label: 'Exam Schedule', path: '/student/exam-schedule' },
  { label: 'Hall Ticket', path: '/student/hall-ticket' },
  { label: 'Take Exam', path: '/student/take-exam' },
  { label: 'Results', path: '/student/results' },
  { label: 'Performance Analytics', path: '/student/analytics' },
  { label: 'Certificates', path: '/student/certificates' },
  { label: 'Notifications', path: '/student/notifications' },
  { label: 'Profile', path: '/student/profile' },
  { label: 'Settings', path: '/student/settings' },
];

const teacherPages = [
  { label: 'Dashboard', path: '/teacher/dashboard' },
  { label: 'Question Bank', path: '/teacher/question-bank' },
  { label: 'AI Question Generator', path: '/teacher/ai-question-generator' },
  { label: 'Question Paper Generator', path: '/teacher/question-paper-generator' },
  { label: 'Exam Management', path: '/teacher/exam-management' },
  { label: 'Evaluation', path: '/teacher/evaluation' },
  { label: 'Student Management', path: '/teacher/student-management' },
  { label: 'Analytics', path: '/teacher/analytics' },
  { label: 'Reports', path: '/teacher/reports' },
  { label: 'Certificate Management', path: '/teacher/certificate-management' },
  { label: 'Notifications', path: '/teacher/notifications' },
  { label: 'Profile', path: '/teacher/profile' },
  { label: 'Settings', path: '/teacher/settings' },
];

function matchingStudentPage(value) {
  const query = value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
  if (query.length < 3) return null;
  const matches = studentPages.filter(({ label }) => {
    const pageName = label.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
    return pageName.includes(query) || (query.length >= 6 && pageName.startsWith(query.slice(0, 6)));
  });
  return matches.length === 1 ? matches[0] : null;
}

export default function TopNavbar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (role !== 'teacher' && location.pathname === '/student/dashboard') setSearch(params.get('q') || '');
  }, [location.pathname, params, role]);
  useEffect(() => {
    let active = true;
    const refresh = () => api('/notifications/unread-count').then((data) => { if (active) setUnreadCount(Number(data.unreadCount) || 0); }).catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [role, location.pathname]);
  const updateSearch = (value) => {
    setSearch(value);
    if (role === 'teacher') return;
    navigate(`/student/dashboard${value.trim() ? `?q=${encodeURIComponent(value)}` : ''}`, { replace: true });
  };
  const teacherSearchResults = role === 'teacher' && search.trim()
    ? teacherPages.filter((page) => page.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    : [];
  const submitSearch = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (role === 'teacher') {
      if (teacherSearchResults[0]) { navigate(teacherSearchResults[0].path); setSearch(''); }
      return;
    }
    const page = matchingStudentPage(search);
    if (page) navigate(page.path);
    else navigate(`/student/dashboard${search.trim() ? `?q=${encodeURIComponent(search)}` : ''}`, { replace: true });
  };

  return (
    <header className="flex items-center justify-between rounded-[24px] border border-blue-400/20 bg-slate-900/60 p-4 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">{role === 'teacher' ? 'Teacher Console' : 'Student Portal'}</p>
        <h2 className="text-lg font-semibold text-slate-100">Welcome back, {user?.name || 'Learner'}</h2>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="relative hidden md:block">
          <label className="flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-slate-950/40 px-3 py-2 text-sm text-slate-400">
            <FaSearch />
            <input aria-label={role === 'teacher' ? 'Search teacher pages' : 'Search portal pages, exams, and results'} aria-autocomplete={role === 'teacher' ? 'list' : undefined} aria-expanded={role === 'teacher' && Boolean(search.trim())} value={search} onChange={(event) => updateSearch(event.target.value)} onKeyDown={submitSearch} className="w-32 border-none bg-transparent text-slate-100 outline-none placeholder:text-slate-500" placeholder={role === 'teacher' ? 'Search teacher pages' : 'Search pages and exams'} />
          </label>
          {role === 'teacher' && search.trim() && <div role="listbox" aria-label="Teacher page search results" className="absolute right-0 top-full z-50 mt-2 max-h-80 min-w-56 overflow-y-auto rounded-xl border border-blue-400/20 bg-slate-950 p-2 text-sm shadow-2xl">
            {teacherSearchResults.length ? teacherSearchResults.map((page) => <button key={page.path} type="button" role="option" aria-selected="false" onClick={() => { navigate(page.path); setSearch(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-slate-200 hover:bg-blue-500/20 hover:text-cyan-200">{page.label}</button>) : <p role="status" className="px-3 py-2 text-slate-400">No teacher pages match “{search.trim()}”.</p>}
          </div>}
        </div>
        <button onClick={() => navigate(role === 'teacher' ? '/teacher/notifications' : '/student/notifications')} aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative rounded-2xl border border-blue-400/20 bg-slate-950/30 p-2.5 text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300">
          <FaBell />{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
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
