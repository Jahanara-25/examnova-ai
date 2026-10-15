import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { FaChartPie, FaClipboardList, FaFileAlt, FaGraduationCap, FaRegBell, FaRobot, FaSignOutAlt, FaUserCog, FaCog, FaUsers, FaBookOpen, FaTasks, FaCertificate, FaSearch } from 'react-icons/fa';

const studentGroups = [
  { label: 'Dashboard', items: [{ to: '/student/dashboard', label: 'Dashboard', icon: FaChartPie }] },
  { label: 'Learning', items: [
    { to: '/student/exam-schedule', label: 'Exam Schedule', icon: FaClipboardList }, { to: '/student/hall-ticket', label: 'Hall Ticket', icon: FaFileAlt },
    { to: '/student/take-exam', label: 'Take Exam', icon: FaGraduationCap }, { to: '/student/results', label: 'Results', icon: FaChartPie },
    { to: '/student/analytics', label: 'Performance Analytics', icon: FaChartPie }, { to: '/student/certificates', label: 'Certificates', icon: FaCertificate },
    { to: '/student/notifications', label: 'Notifications', icon: FaRegBell },
  ] },
  { label: 'Account', items: [{ to: '/student/profile', label: 'Profile', icon: FaUserCog }, { to: '/student/settings', label: 'Settings', icon: FaCog }, { to: '/', label: 'Logout', icon: FaSignOutAlt }] },
];

const teacherGroups = [
  { label: 'Dashboard', items: [{ to: '/teacher/dashboard', label: 'Dashboard', icon: FaChartPie }] },
  { label: 'Question tools', items: [
    { to: '/teacher/question-bank', label: 'Question Bank', icon: FaBookOpen },
    { to: '/teacher/question-paper-generator', label: 'AI Assisted Question Generator', icon: FaFileAlt },
  ] },
  { label: 'Exams', items: [{ to: '/teacher/exam-management', label: 'Exam Management', icon: FaClipboardList }, { to: '/teacher/evaluation', label: 'Evaluation', icon: FaTasks }] },
  { label: 'People and reports', items: [
    { to: '/teacher/student-management', label: 'Student Management', icon: FaUsers }, { to: '/teacher/analytics', label: 'Analytics', icon: FaChartPie },
    { to: '/teacher/reports', label: 'Reports', icon: FaFileAlt }, { to: '/teacher/certificate-management', label: 'Certificate Management', icon: FaCertificate },
    { to: '/teacher/notifications', label: 'Notifications', icon: FaRegBell },
  ] },
  { label: 'Account', items: [{ to: '/teacher/profile', label: 'Profile', icon: FaUserCog }, { to: '/teacher/settings', label: 'Settings', icon: FaCog }, { to: '/', label: 'Logout', icon: FaSignOutAlt }] },
];

function NavigationLink({ item }) {
  const Icon = item.icon;
  return <NavLink end={item.label === 'Dashboard'} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-950/60' : 'text-slate-300 hover:bg-white/10 hover:text-cyan-200'}`}><Icon /><span>{item.label}</span></NavLink>;
}

export default function Sidebar({ role }) {
  const location = useLocation();
  const groups = role === 'teacher' ? teacherGroups : studentGroups;
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const normalized = query.trim().toLocaleLowerCase();
  const matchingGroups = useMemo(() => groups.map((group) => ({ ...group, items: group.items.filter((item) => !normalized || item.label.toLocaleLowerCase().includes(normalized)) })).filter((group) => group.items.length), [groups, normalized]);
  useEffect(() => {
    if (normalized) setExpanded(Object.fromEntries(matchingGroups.map((group) => [group.label, true])));
    else setExpanded(Object.fromEntries(groups.map((group) => [group.label, group.items.some((item) => location.pathname === item.to)])));
  }, [normalized, matchingGroups, groups, location.pathname]);

  return <aside className="hidden w-72 shrink-0 flex-col rounded-[28px] border border-blue-400/20 bg-slate-950/80 p-5 text-slate-100 shadow-2xl shadow-blue-950/50 backdrop-blur-xl lg:flex">
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3"><img src={logo} alt="ExamNova AI" className="sidebar-logo" /><p className="mt-2 text-xs text-slate-400">{role === 'teacher' ? 'Instructor Suite' : 'Student Portal'}</p></div>
    <label className="mb-4 flex items-center gap-2 rounded-xl border border-blue-400/20 bg-slate-950/40 px-3 py-2 text-sm text-slate-300"><FaSearch aria-hidden="true" /><input aria-label="Search sidebar navigation" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500" placeholder="Search navigation" /></label>
    <nav aria-label={`${role} navigation`} className="flex flex-1 flex-col gap-2 overflow-y-auto">
      {matchingGroups.map((group) => {
        const isOpen = Boolean(expanded[group.label]);
        const isDirect = group.items.length === 1 && group.label === 'Dashboard';
        return isDirect ? <NavigationLink key={group.label} item={group.items[0]} /> : <section key={group.label} className="rounded-xl">
          <button type="button" aria-expanded={isOpen} onClick={() => setExpanded((current) => ({ ...current, [group.label]: !current[group.label] }))} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-cyan-200">{group.label}<span aria-hidden="true">{isOpen ? '−' : '+'}</span></button>
          {isOpen && <div className="ml-2 space-y-1 border-l border-white/10 pl-2">{group.items.map((item) => <NavigationLink key={item.to} item={item} />)}</div>}
        </section>;
      })}
      {normalized && matchingGroups.length === 0 && <p role="status" className="px-3 py-4 text-sm text-slate-400">No navigation pages match “{query.trim()}”.</p>}
    </nav>
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300"><p className="font-semibold text-white">ExamNova.ai</p><p className="mt-1 text-xs">{role === 'teacher' ? 'Teacher workspace' : 'Student workspace'}</p></div>
  </aside>;
}
