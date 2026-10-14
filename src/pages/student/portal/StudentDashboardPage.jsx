import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCalendarAlt, FaClipboardList, FaChartLine, FaBell, FaArrowRight } from 'react-icons/fa';
import { PageHeader, StatCard, ReusableCard, EmptyState } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';
import { examAvailability, formatExamDateTime } from '../../../lib/dateTime';

export default function StudentDashboardPage() {
  const [data, setData] = useState({ exams: [], results: [], notifications: [], analytics: { totalExams: 0, average: 0 } });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') || '').trim().toLocaleLowerCase();
  const matchingResults = data.results.filter((result) => !query || `${result.examId?.title || ''} ${result.examId?.subject || ''}`.toLocaleLowerCase().includes(query));
  useEffect(() => {
    Promise.all([api('/exams/available'), api('/results'), api('/notifications'), api('/analytics/student')])
      .then(([exams, results, notifications, analytics]) => setData({ exams: exams.exams, results: results.results, notifications: notifications.notifications, analytics }))
      .catch(() => setError('Unable to load dashboard data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);
  const cards = [
    { title: 'Available Exams', value: data.exams.length, subtitle: 'Published for your department', icon: FaCalendarAlt, accent: 'from-indigo-600 to-blue-500' },
    { title: 'Results Published', value: data.analytics.totalExams, subtitle: 'Completed evaluations', icon: FaClipboardList, accent: 'from-violet-600 to-purple-500' },
    { title: 'Average Score', value: `${data.analytics.average}%`, subtitle: 'Published results only', icon: FaChartLine, accent: 'from-emerald-600 to-teal-500' },
    { title: 'Unread Updates', value: data.notifications.filter((n) => !n.read).length, subtitle: 'Exam and result alerts', icon: FaBell, accent: 'from-amber-500 to-orange-500' },
  ];
  return <div className="space-y-6">
    <PageHeader title="Student Dashboard" subtitle="Your live assessment activity" />
    {error && <p className="text-rose-300">{error}</p>}
    {loading ? <p className="text-cyan-300">Loading dashboard data...</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <StatCard key={card.title} {...card} />)}</div>}
    <ReusableCard title="Quick Actions"><div className="grid gap-3 md:grid-cols-4">{[['Exam Schedule', '/student/exam-schedule'], ['Take Exam', '/student/take-exam'], ['View Results', '/student/results'], ['Performance Analytics', '/student/analytics']].map(([label, to]) => <Link key={to} to={to} className="flex items-center justify-between rounded-2xl border border-blue-500/20 p-4 text-slate-200">{label}<FaArrowRight /></Link>)}</div></ReusableCard>
    <div className="grid gap-6 xl:grid-cols-2">
      <ReusableCard title="Available Exams" subtitle="Published by your teachers">
        <label className="mb-4 block"><span className="sr-only">Filter exams and results</span><input type="search" value={params.get('q') || ''} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })} placeholder="Search exams, subjects, and results" className="w-full rounded-xl border border-blue-500/20 bg-slate-950/40 px-4 py-3 text-slate-100" /></label>
        {loading ? 'Loading exams...' : error ? <EmptyState title="Search unavailable." message="Dashboard data could not be loaded. Please retry." /> : (() => { const exams = data.exams.filter((exam) => !query || `${exam.title} ${exam.subject} ${exam.department}`.toLocaleLowerCase().includes(query)); return exams.length ? exams.slice(0, 5).map((exam) => { const state = examAvailability(exam); return <div className="mb-3 rounded-2xl border border-blue-500/20 p-3 text-slate-200" key={exam._id}><b>{exam.title}</b><p className="text-sm">{exam.subject} · {exam.department} · {exam.totalMarks} marks</p><p className="text-xs text-slate-400">{formatExamDateTime(exam.startDate)} IST · {state} · {exam.duration} minutes</p><Link className="mt-2 inline-block text-cyan-300" to={`/student/take-exam?examId=${exam._id}`}>{state === 'Live' ? 'Take Exam' : 'View Exam'}</Link></div>; }) : <EmptyState title={query ? 'No matching exams.' : 'No available exams.'} message={query ? 'Try another exam title or subject.' : 'Published exams for your department will appear here.'} />; })()}
      </ReusableCard>
      <ReusableCard title="Recent Results" subtitle="Results your teacher has published">
        {loading ? 'Loading results...' : error ? <EmptyState title="Search unavailable." message="Dashboard data could not be loaded. Please retry." /> : matchingResults.length ? matchingResults.slice(0, 5).map((result) => <Link to="/student/results" className="mb-3 block rounded-2xl border border-blue-500/20 p-3 text-slate-200" key={result._id}><b>{result.examId?.title || 'Exam'}</b><p>{result.examId?.subject}</p><p>{result.obtainedMarks}/{result.totalMarks} · {result.percentage}%</p></Link>) : <EmptyState title={query ? 'No matching results.' : 'No published results yet.'} message={query ? 'Try another exam title or subject.' : 'Your evaluated results will appear here.'} />}
      </ReusableCard>
    </div>
  </div>;
}
