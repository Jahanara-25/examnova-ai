import React, { Component, lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './hooks/useProtectedRoute';
import { ToastProvider } from './components/ui/PortalUI';
import BackButton from './components/common/BackButton';
import TeacherLayout from './components/layouts/TeacherLayout';

const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const RoleSelectionPage = lazy(() => import('./pages/auth/RoleSelectionPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
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
  return <div className="app-loading flex min-h-screen items-center justify-center text-sm font-medium text-cyan-500">Loading experience...</div>;
}

function TeacherPortalPage({ children }) {
  return <ProtectedRoute requiredRole="teacher"><TeacherLayout>{children}</TeacherLayout></ProtectedRoute>;
}

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // A deployment can leave an open tab pointing to an old lazy-loaded chunk.
    // Refresh once automatically; otherwise show a recovery action instead of a blank page.
    const isChunkError = /chunk|dynamically imported module|failed to fetch/i.test(error?.message || '');
    const reloadKey = 'examnova-chunk-reload';
    if (isChunkError) {
      try {
        const lastReloadAt = Number(sessionStorage.getItem(reloadKey) || 0);
        if (Date.now() - lastReloadAt > 15000) {
          sessionStorage.setItem(reloadKey, String(Date.now()));
          window.location.reload();
        }
      } catch {
        // Storage can be unavailable in restricted browser contexts; keep the fallback usable.
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-loading flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-blue-400/30 bg-slate-950/80 p-6 text-center shadow-2xl">
          <h1 className="text-xl font-bold text-white">This page could not be loaded</h1>
          <p className="mt-2 text-sm text-slate-300">Please refresh the page. If the problem continues, return to the dashboard and try again.</p>
          {import.meta.env.DEV && this.state.error?.message && <details open className="mt-3 max-h-48 overflow-auto text-left text-xs text-rose-700"><summary>Development error details</summary><pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}{this.state.errorInfo?.componentStack}</pre></details>}
          <div className="mt-5 flex justify-center gap-3">
            <button className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950" onClick={() => window.location.reload()}>Refresh</button>
            <button className="rounded-xl border border-slate-500 px-4 py-2 font-medium text-white" onClick={() => { window.location.href = '/'; }}>Home</button>
          </div>
        </div>
      </main>
    );
  }
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const showShell = !location.pathname.startsWith('/student') && !location.pathname.startsWith('/teacher') && !location.pathname.startsWith('/admin');

  return (
    <>
      {showShell && <Navbar />}
      <BackButton className="global-back-button" />
      <PageErrorBoundary key={location.pathname}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/role-selection" element={<RoleSelectionPage />} />
          <Route path="/auth/login/:role" element={<LoginPage />} />
          <Route path="/auth/forgot-password/:role" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
          <Route path="/teacher/question-bank" element={<TeacherPortalPage><TeacherQuestionBankPage /></TeacherPortalPage>} />
          <Route path="/teacher/ai-question-generator" element={<TeacherPortalPage><TeacherAiQuestionGeneratorPage /></TeacherPortalPage>} />
          <Route path="/teacher/question-paper-generator" element={<TeacherPortalPage><TeacherQuestionPaperGeneratorPage /></TeacherPortalPage>} />
          <Route path="/teacher/exam-management" element={<TeacherPortalPage><TeacherExamManagementPage /></TeacherPortalPage>} />
          <Route path="/teacher/student-management" element={<TeacherPortalPage><TeacherStudentManagementPage /></TeacherPortalPage>} />
          <Route path="/teacher/evaluation" element={<TeacherPortalPage><TeacherEvaluationPage /></TeacherPortalPage>} />
          <Route path="/teacher/analytics" element={<TeacherPortalPage><TeacherAnalyticsPage /></TeacherPortalPage>} />
          <Route path="/teacher/reports" element={<TeacherPortalPage><TeacherReportsPage /></TeacherPortalPage>} />
          <Route path="/teacher/certificate-management" element={<TeacherPortalPage><TeacherCertificateManagementPage /></TeacherPortalPage>} />
          <Route path="/teacher/notifications" element={<TeacherPortalPage><TeacherNotificationsPage /></TeacherPortalPage>} />
          <Route path="/teacher/profile" element={<TeacherPortalPage><TeacherProfilePage /></TeacherPortalPage>} />
          <Route path="/teacher/settings" element={<TeacherPortalPage><TeacherSettingsPage /></TeacherPortalPage>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </PageErrorBoundary>
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
