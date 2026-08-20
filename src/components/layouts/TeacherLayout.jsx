import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { Breadcrumbs } from '../ui/PortalUI';

const routeMap = {
  '/teacher/dashboard': [{ label: 'Teacher' }, { label: 'Dashboard' }],
  '/teacher/question-bank': [{ label: 'Teacher' }, { label: 'Question Bank' }],
  '/teacher/ai-question-generator': [{ label: 'Teacher' }, { label: 'AI Question Generator' }],
  '/teacher/question-paper-generator': [{ label: 'Teacher' }, { label: 'Question Paper Generator' }],
  '/teacher/exam-management': [{ label: 'Teacher' }, { label: 'Exam Management' }],
  '/teacher/student-management': [{ label: 'Teacher' }, { label: 'Student Management' }],
  '/teacher/evaluation': [{ label: 'Teacher' }, { label: 'Evaluation' }],
  '/teacher/analytics': [{ label: 'Teacher' }, { label: 'Analytics' }],
  '/teacher/reports': [{ label: 'Teacher' }, { label: 'Reports' }],
  '/teacher/certificate-management': [{ label: 'Teacher' }, { label: 'Certificate Management' }],
  '/teacher/notifications': [{ label: 'Teacher' }, { label: 'Notifications' }],
  '/teacher/profile': [{ label: 'Teacher' }, { label: 'Profile' }],
  '/teacher/settings': [{ label: 'Teacher' }, { label: 'Settings' }],
};

export default function TeacherLayout({ children }) {
  const location = useLocation();
  const breadcrumbs = routeMap[location.pathname] || [{ label: 'Teacher' }, { label: 'Portal' }];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.14),_transparent_30%),#0F172A] p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        <Sidebar role="teacher" />
        <div className="flex-1 space-y-5">
          <TopNavbar role="teacher" />
          <Breadcrumbs items={breadcrumbs} />
          <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
