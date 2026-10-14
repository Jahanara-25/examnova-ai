import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, StatCard, ReusableCard, EmptyState } from '../../../components/ui/PortalUI';
import { FaChartLine, FaUsers, FaCheckCircle, FaClipboardList } from 'react-icons/fa';
import { api } from '../../../lib/api';

const COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6'];

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = () => api('/analytics/teacher')
      .then((data) => { setStats(data); setError(''); })
      .catch(() => setError('Unable to load analytics. Please try again.'));
    loadAnalytics();
    const refreshInterval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  return <div className="space-y-6">
    <PageHeader title="Analytics" subtitle="Actual assessment activity from your account" />
    {error && <p className="text-rose-300">{error}</p>}
    {!stats && !error ? <p className="text-cyan-300">Loading analytics...</p> : stats && <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Exams" value={stats.activeExams} subtitle="Published exams" icon={FaClipboardList} accent="from-indigo-600 to-blue-500" />
        <StatCard title="Students Reviewed" value={stats.totalSubmissions - stats.pendingEvaluations} subtitle="Submitted attempts" icon={FaUsers} accent="from-blue-600 to-cyan-500" />
        <StatCard title="Average Score" value={`${stats.averageScore}%`} subtitle="Published results" icon={FaChartLine} accent="from-violet-600 to-indigo-500" />
        <StatCard title="Pass Rate" value={`${stats.passRate}%`} subtitle="Results at or above 40%" icon={FaCheckCircle} accent="from-emerald-600 to-teal-500" />
      </div>
      {stats.trend?.length ? <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ReusableCard title="Result Trend" subtitle="Published scores in evaluation order">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
        <ReusableCard title="Subject Scores" subtitle="Average percentage by subject">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.subjects} dataKey="value" nameKey="name" innerRadius={56} outerRadius={90} paddingAngle={3}>
                  {stats.subjects.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
      </div> : <EmptyState title="No published results yet." message="Charts appear when evaluated results are published for your exams." />}
      <ReusableCard title="Assessment Summary">
        {stats.totalExams || stats.totalSubmissions ? <div className="grid gap-3 text-slate-200 md:grid-cols-3"><p>Total exams: {stats.totalExams}</p><p>Total submissions: {stats.totalSubmissions}</p><p>Pending evaluation: {stats.pendingEvaluations}</p></div> : <EmptyState title="No assessment activity yet." message="Create an exam and publish results to see analytics." />}
      </ReusableCard>
    </>}
  </div>;
}
