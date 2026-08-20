import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, ReusableCard, StatCard } from '../../../components/ui/PortalUI';
import { analyticsData, subjectBreakdown } from '../../../data/mockData';
import { FaChartLine, FaUsers, FaCheckCircle } from 'react-icons/fa';

const COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Institution and subject-level performance insights" />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pass Rate" value="91%" subtitle="Last evaluation cycle" icon={FaCheckCircle} accent="from-emerald-600 to-teal-500" />
        <StatCard title="Students" value="148" subtitle="Active cohort" icon={FaUsers} accent="from-blue-600 to-cyan-500" />
        <StatCard title="Trend" value="+7%" subtitle="Quarter-over-quarter" icon={FaChartLine} accent="from-violet-600 to-indigo-500" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ReusableCard title="Overall Performance" subtitle="Recent course-level trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#0f172a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
        <ReusableCard title="Subject Performance" subtitle="Relative proficiency">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectBreakdown} dataKey="value" innerRadius={58} outerRadius={94} paddingAngle={3}>
                  {subjectBreakdown.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
      </div>
      <ReusableCard title="Subject Comparison" subtitle="Average performance by topic">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReusableCard>
    </div>
  );
}
