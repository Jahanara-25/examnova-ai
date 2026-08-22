import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { FaChartPie, FaClipboardList, FaFileAlt, FaGraduationCap, FaRegBell, FaRobot, FaQuestionCircle, FaShieldAlt, FaSignOutAlt, FaUserCog, FaCog, FaUsers, FaBookOpen, FaTasks, FaCertificate } from 'react-icons/fa';

const studentItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: FaChartPie },
  { to: '/student/exam-schedule', label: 'Exam Schedule', icon: FaClipboardList },
  { to: '/student/hall-ticket', label: 'Hall Ticket', icon: FaFileAlt },
  { to: '/student/take-exam', label: 'Take Exam', icon: FaGraduationCap },
  { to: '/student/results', label: 'Results', icon: FaChartPie },
  { to: '/student/analytics', label: 'Performance Analytics', icon: FaChartPie },
  { to: '/student/certificates', label: 'Certificates', icon: FaCertificate },
  { to: '/student/notifications', label: 'Notifications', icon: FaRegBell },
  { to: '/student/ai-chatbot', label: 'AI Chatbot', icon: FaRobot },
  { to: '/student/profile', label: 'Profile', icon: FaUserCog },
  { to: '/student/settings', label: 'Settings', icon: FaCog },
  { to: '/', label: 'Logout', icon: FaSignOutAlt },
];

const teacherItems = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: FaChartPie },
  { to: '/teacher/question-bank', label: 'Question Bank', icon: FaBookOpen },
  { to: '/teacher/ai-question-generator', label: 'AI Question Generator', icon: FaRobot },
  { to: '/teacher/question-paper-generator', label: 'Question Paper Generator', icon: FaFileAlt },
  { to: '/teacher/exam-management', label: 'Exam Management', icon: FaClipboardList },
  { to: '/teacher/student-management', label: 'Student Management', icon: FaUsers },
  { to: '/teacher/evaluation', label: 'Evaluation', icon: FaTasks },
  { to: '/teacher/analytics', label: 'Analytics', icon: FaChartPie },
  { to: '/teacher/reports', label: 'Reports', icon: FaFileAlt },
  { to: '/teacher/certificate-management', label: 'Certificate Management', icon: FaCertificate },
  { to: '/teacher/notifications', label: 'Notifications', icon: FaRegBell },
  { to: '/teacher/profile', label: 'Profile', icon: FaUserCog },
  { to: '/teacher/settings', label: 'Settings', icon: FaCog },
  { to: '/', label: 'Logout', icon: FaSignOutAlt },
];

export default function Sidebar({ role }) {
  const items = role === 'teacher' ? teacherItems : studentItems;
  return (
    <aside className="hidden w-72 shrink-0 flex-col rounded-[28px] border border-blue-400/20 bg-slate-950/80 p-5 text-slate-100 shadow-2xl shadow-blue-950/50 backdrop-blur-xl lg:flex">
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-3">
        <img src={logo} alt="ExamNova AI" className="sidebar-logo" />
        <p className="mt-2 text-xs text-slate-400">{role === 'teacher' ? 'Instructor Suite' : 'Student Portal'}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-950/60' : 'text-slate-300 hover:bg-white/10 hover:text-cyan-200'}`}>
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">AI assisted valuation</p>
        <p className="mt-1 text-xs">All exam operations are mock-ready for fast API integration.</p>
      </div>
    </aside>
  );
}
