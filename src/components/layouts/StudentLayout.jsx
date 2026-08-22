import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { Breadcrumbs } from '../ui/PortalUI';

const routeMap = {
  '/student/dashboard': [{ label: 'Student' }, { label: 'Dashboard' }],
  '/student/exam-schedule': [{ label: 'Student' }, { label: 'Exam Schedule' }],
  '/student/hall-ticket': [{ label: 'Student' }, { label: 'Hall Ticket' }],
  '/student/take-exam': [{ label: 'Student' }, { label: 'Take Exam' }],
  '/student/results': [{ label: 'Student' }, { label: 'Results' }],
  '/student/analytics': [{ label: 'Student' }, { label: 'Performance Analytics' }],
  '/student/certificates': [{ label: 'Student' }, { label: 'Certificates' }],
  '/student/notifications': [{ label: 'Student' }, { label: 'Notifications' }],
  '/student/ai-chatbot': [{ label: 'Student' }, { label: 'AI Chatbot' }],
  '/student/profile': [{ label: 'Student' }, { label: 'Profile' }],
  '/student/settings': [{ label: 'Student' }, { label: 'Settings' }],
};

export default function StudentLayout({ children }) {
  const location = useLocation();
  const breadcrumbs = routeMap[location.pathname] || [{ label: 'Student' }, { label: 'Portal' }];

  return (
    <div className="portal-layout min-h-screen p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        <Sidebar role="student" />
        <div className="flex-1 space-y-5">
          <TopNavbar role="student" />
          <Breadcrumbs items={breadcrumbs} />
          <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
