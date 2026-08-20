import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { PageHeader, ReusableButton, ReusableCard, StatCard } from '../../../components/ui/PortalUI';
import { resultsData } from '../../../data/mockData';
import { FaChartBar, FaTrophy, FaCheckCircle, FaTimesCircle, FaMinusCircle } from 'react-icons/fa';

const chartData = [{ name: 'OS', score: 91 }, { name: 'DBMS', score: 85 }, { name: 'ML', score: 88 }, { name: 'DSA', score: 84 }];

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Results" subtitle="Performance snapshot and subject-wise scoring" action={<ReusableButton>Download Report</ReusableButton>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Overall Score" value={`${resultsData.overall}%`} subtitle="Excellent pace" icon={FaChartBar} accent="from-emerald-600 to-teal-500" />
        <StatCard title="Rank" value={`#${resultsData.rank}`} subtitle="Out of 148" icon={FaTrophy} accent="from-violet-600 to-indigo-500" />
        <StatCard title="Correct" value={`${resultsData.correct}`} subtitle="Across attempted questions" icon={FaCheckCircle} accent="from-blue-600 to-cyan-500" />
        <StatCard title="Wrong/Skipped" value={`${resultsData.wrong}/${resultsData.skipped}`} subtitle="Review recommended" icon={FaTimesCircle} accent="from-amber-500 to-orange-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ReusableCard title="Subject-wise Marks" subtitle="Comparative performance">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" radius={[10, 10, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
        <ReusableCard title="Trend Overview" subtitle="Steady upward movement">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
      </div>

      <ReusableCard title="Detailed Breakdown" subtitle="Subject marks and feedback">
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {resultsData.subjectMarks.map((item) => (
            <div key={item.subject} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{item.subject}</p>
                <p className="font-semibold text-slate-900">{item.marks}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${item.marks}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ReusableCard>
    </div>
  );
}
