import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './hooks/useProtectedRoute';
import { ToastProvider } from './components/ui/PortalUI';

const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const RoleSelectionPage = lazy(() => import('./pages/auth/RoleSelectionPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentExamSchedulePage = lazy(() => import('./pages/student/portal/ExamSchedulePage'));
const StudentHallTicketPage = lazy(() => import('./pages/student/portal/HallTicketPage'));
const StudentTakeExamPage = lazy(() => import('./pages/student/portal/TakeExamPage'));
const StudentResultsPage = lazy(() => import('./pages/student/portal/ResultsPage'));
const StudentAnalyticsPage = lazy(() => import('./pages/student/portal/AnalyticsPage'));
const StudentCertificatesPage = lazy(() => import('./pages/student/portal/CertificatesPage'));
const StudentNotificationsPage = lazy(() => import('./pages/student/portal/NotificationsPage'));
const StudentAiChatbotPage = lazy(() => import('./pages/student/portal/AiChatbotPage'));
const StudentProfilePage = lazy(() => import('./pages/student/portal/ProfilePage'));
const StudentSettingsPage = lazy(() => import('./pages/student/portal/SettingsPage'));
const TeacherQuestionBankPage = lazy(() => import('./pages/teacher/portal/QuestionBankPage'));
const TeacherAiQuestionGeneratorPage = lazy(() => import('./pages/teacher/portal/AiQuestionGeneratorPage'));
const TeacherQuestionPaperGeneratorPage = lazy(() => import('./pages/teacher/portal/QuestionPaperGeneratorPage'));
const TeacherExamManagementPage = lazy(() => import('./pages/teacher/portal/ExamManagementPage'));
const TeacherStudentManagementPage = lazy(() => import('./pages/teacher/portal/StudentManagementPage'));
const TeacherEvaluationPage = lazy(() => import('./pages/teacher/portal/EvaluationPage'));
const TeacherAnalyticsPage = lazy(() => import('./pages/teacher/portal/AnalyticsPage'));
const TeacherReportsPage = lazy(() => import('./pages/teacher/portal/ReportsPage'));
const TeacherCertificateManagementPage = lazy(() => import('./pages/teacher/portal/CertificateManagementPage'));
const TeacherNotificationsPage = lazy(() => import('./pages/teacher/portal/NotificationsPage'));
const TeacherProfilePage = lazy(() => import('./pages/teacher/portal/ProfilePage'));
const TeacherSettingsPage = lazy(() => import('./pages/teacher/portal/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function LoadingFallback() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-cyan-300">Loading experience...</div>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const showShell = !location.pathname.startsWith('/student') && !location.pathname.startsWith('/teacher') && !location.pathname.startsWith('/admin');

  return (
    <>
      {showShell && <Navbar />}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/role-selection" element={<RoleSelectionPage />} />
          <Route path="/auth/login/:role" element={<LoginPage />} />
          <Route path="/student/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/exam-schedule" element={<ProtectedRoute requiredRole="student"><StudentExamSchedulePage /></ProtectedRoute>} />
          <Route path="/student/hall-ticket" element={<ProtectedRoute requiredRole="student"><StudentHallTicketPage /></ProtectedRoute>} />
          <Route path="/student/take-exam" element={<ProtectedRoute requiredRole="student"><StudentTakeExamPage /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute requiredRole="student"><StudentResultsPage /></ProtectedRoute>} />
          <Route path="/student/analytics" element={<ProtectedRoute requiredRole="student"><StudentAnalyticsPage /></ProtectedRoute>} />
          <Route path="/student/certificates" element={<ProtectedRoute requiredRole="student"><StudentCertificatesPage /></ProtectedRoute>} />
          <Route path="/student/notifications" element={<ProtectedRoute requiredRole="student"><StudentNotificationsPage /></ProtectedRoute>} />
          <Route path="/student/ai-chatbot" element={<ProtectedRoute requiredRole="student"><StudentAiChatbotPage /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfilePage /></ProtectedRoute>} />
          <Route path="/student/settings" element={<ProtectedRoute requiredRole="student"><StudentSettingsPage /></ProtectedRoute>} />
          <Route path="/teacher/dashboard" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/question-bank" element={<ProtectedRoute requiredRole="teacher"><TeacherQuestionBankPage /></ProtectedRoute>} />
          <Route path="/teacher/ai-question-generator" element={<ProtectedRoute requiredRole="teacher"><TeacherAiQuestionGeneratorPage /></ProtectedRoute>} />
          <Route path="/teacher/question-paper-generator" element={<ProtectedRoute requiredRole="teacher"><TeacherQuestionPaperGeneratorPage /></ProtectedRoute>} />
          <Route path="/teacher/exam-management" element={<ProtectedRoute requiredRole="teacher"><TeacherExamManagementPage /></ProtectedRoute>} />
          <Route path="/teacher/student-management" element={<ProtectedRoute requiredRole="teacher"><TeacherStudentManagementPage /></ProtectedRoute>} />
          <Route path="/teacher/evaluation" element={<ProtectedRoute requiredRole="teacher"><TeacherEvaluationPage /></ProtectedRoute>} />
          <Route path="/teacher/analytics" element={<ProtectedRoute requiredRole="teacher"><TeacherAnalyticsPage /></ProtectedRoute>} />
          <Route path="/teacher/reports" element={<ProtectedRoute requiredRole="teacher"><TeacherReportsPage /></ProtectedRoute>} />
          <Route path="/teacher/certificate-management" element={<ProtectedRoute requiredRole="teacher"><TeacherCertificateManagementPage /></ProtectedRoute>} />
          <Route path="/teacher/notifications" element={<ProtectedRoute requiredRole="teacher"><TeacherNotificationsPage /></ProtectedRoute>} />
          <Route path="/teacher/profile" element={<ProtectedRoute requiredRole="teacher"><TeacherProfilePage /></ProtectedRoute>} />
          <Route path="/teacher/settings" element={<ProtectedRoute requiredRole="teacher"><TeacherSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {showShell && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
