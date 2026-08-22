import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChartLine, FaClipboardList, FaBookOpen, FaTasks, FaArrowRight } from 'react-icons/fa';
import { PageHeader, StatCard, ReusableCard, EmptyState } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';

export default function TeacherDashboardPage() {
  const [analytics, setAnalytics] = useState({ activeExams: 0, totalSubmissions: 0, pendingEvaluations: 0, passRate: 0 });
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/analytics/teacher'), api('/exams/mine'), api('/questions'), api('/submissions/teacher/list')])
      .then(([stats, examData, questionData, submissionData]) => {
        setAnalytics(stats); setExams(examData.exams); setQuestionCount(questionData.questions.length); setSubmissions(submissionData.submissions);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const cards = [
    { title: 'Active Exams', value: analytics.activeExams, subtitle: 'Published exams', icon: FaClipboardList, accent: 'from-indigo-600 to-blue-500' },
    { title: 'Questions Added', value: questionCount, subtitle: 'Questions in your bank', icon: FaBookOpen, accent: 'from-violet-600 to-purple-500' },
    { title: 'Pending Review', value: analytics.pendingEvaluations, subtitle: 'Submitted attempts awaiting evaluation', icon: FaTasks, accent: 'from-amber-500 to-orange-500' },
    { title: 'Pass Rate', value: `${analytics.passRate}%`, subtitle: 'From published results', icon: FaChartLine, accent: 'from-emerald-600 to-teal-500' },
  ];

  return <div className="space-y-6"><PageHeader title="Teacher Dashboard" subtitle="Real assessment activity from your account" />
    {error && <p className="text-rose-300">{error}</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <StatCard key={item.title} {...item} />)}</div>
    <div className="grid gap-6 xl:grid-cols-2"><ReusableCard title="Your Exams" subtitle="Drafts, published and closed exams">{exams.length ? exams.map((exam) => <div className="mb-3 rounded-2xl border border-blue-500/20 p-3 text-slate-200" key={exam._id}><b>{exam.title}</b><p className="text-sm">{exam.subject} · {exam.status}</p><small>{new Date(exam.startDate).toLocaleString()}</small></div>) : <EmptyState title="No exams yet." message="Create an exam to begin." />}</ReusableCard>
      <ReusableCard title="Pending Evaluation" subtitle="Real student submissions">{submissions.length ? submissions.filter((item) => item.examId).map((item) => <div className="mb-3 rounded-2xl border border-blue-500/20 p-3 text-slate-200" key={item._id}><b>{item.studentId?.name || 'Student'}</b><p className="text-sm">{item.examId?.title} · {item.objectiveMarks}/{item.examId?.totalMarks}</p></div>) : <EmptyState title="No student submissions yet." message="Submitted attempts will appear here." />}</ReusableCard></div>
    <ReusableCard title="Quick Actions"><div className="grid gap-3 md:grid-cols-3">{[['Create Exam','/teacher/exam-management'],['Manage Questions','/teacher/question-bank'],['Evaluate Submissions','/teacher/evaluation']].map(([label,to]) => <Link key={to} to={to} className="flex items-center justify-between rounded-2xl border border-blue-500/20 p-4 text-slate-200 hover:bg-slate-900/40">{label}<FaArrowRight /></Link>)}</div></ReusableCard>
  </div>;
}
