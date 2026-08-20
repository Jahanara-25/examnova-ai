import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { PageHeader, ReusableCard, StatCard } from '../../../components/ui/PortalUI';
import { analyticsData, subjectBreakdown } from '../../../data/mockData';
import { FaChartLine, FaBrain, FaBookOpen } from 'react-icons/fa';

const COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Performance Analytics" subtitle="Deep dive into learning trends and strengths" />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Consistency" value="92%" subtitle="Across 6 months" icon={FaChartLine} accent="from-blue-600 to-cyan-500" />
        <StatCard title="Strong Subjects" value="2" subtitle="Math and CS" icon={FaBrain} accent="from-violet-600 to-indigo-500" />
        <StatCard title="Focus Areas" value="3" subtitle="Need improvement" icon={FaBookOpen} accent="from-amber-500 to-orange-500" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ReusableCard title="Learning Trend" subtitle="Average growth over time">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
        <ReusableCard title="Subject Mix" subtitle="Performance by topic">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectBreakdown} dataKey="value" innerRadius={56} outerRadius={90} paddingAngle={3}>
                  {subjectBreakdown.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ReusableCard title="Strong Subjects" subtitle="Domains where you are performing well">
          <div className="mt-4 space-y-3">
            {['Computer Science', 'Mathematics'].map((item) => <div key={item} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{item}</div>)}
          </div>
        </ReusableCard>
        <ReusableCard title="Weak Subjects" subtitle="Recommended focus areas">
          <div className="mt-4 space-y-3">
            {['Physics', 'Communication Skills'].map((item) => <div key={item} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{item}</div>)}
          </div>
        </ReusableCard>
      </div>
    </div>
  );
}
