import { FaCalendarAlt, FaClipboardList, FaChartLine, FaBell, FaTasks, FaArrowRight, FaBookOpen } from 'react-icons/fa';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, StatCard, ReusableCard, ReusableButton } from '../../../components/ui/PortalUI';
import { studentStats, upcomingExams, recentResults, analyticsData, subjectBreakdown, notificationsData } from '../../../data/mockData';

const COLORS = ['#2563eb', '#8b5cf6', '#14b8a6', '#f59e0b'];

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Student Dashboard" subtitle="Your academy performance and assessment overview" action={<ReusableButton>View Full Report</ReusableButton>} />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <ReusableCard title="Welcome back, Aarav" subtitle="You are progressing strongly across your current semester.">
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl bg-slate-900 p-5 text-white">
              <p className="text-sm text-slate-300">Current momentum</p>
              <h3 className="mt-2 text-2xl font-semibold">4 upcoming assessments and 94% attendance</h3>
              <p className="mt-3 text-sm text-slate-300">Keep your streak going with focused revision and timely submissions.</p>
            </div>
            <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><FaBookOpen /> Study Plan</div>
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">Complete ML revision notes by Friday.</div>
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">Attend OS doubt-solving session at 6PM.</div>
            </div>
          </div>
        </ReusableCard>
        <ReusableCard title="Quick Actions" subtitle="Jump to key activities">
          <div className="mt-4 space-y-3">
            {['Take Exam', 'View Results', 'Download Hall Ticket', 'Open Chat'].map((item) => (
              <button key={item} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">
                <span>{item}</span>
                <FaArrowRight />
              </button>
            ))}
          </div>
        </ReusableCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {studentStats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} subtitle={item.subtitle} icon={{ FaClipboardList, FaCalendarAlt, FaChartLine, FaTasks }[item.icon] || FaChartLine} accent={item.accent} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ReusableCard title="Performance Trend" subtitle="Your monthly score trajectory">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
        <ReusableCard title="Subject Strength" subtitle="Current proficiency distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectBreakdown} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {subjectBreakdown.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReusableCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ReusableCard title="Upcoming Exams" subtitle="Your next milestones">
          <div className="mt-4 space-y-3">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{exam.title}</p>
                  <p className="text-sm text-slate-500">{exam.date} • {exam.duration} • {exam.venue}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{exam.status}</span>
              </div>
            ))}
          </div>
        </ReusableCard>
        <ReusableCard title="Recent Results" subtitle="Latest score updates">
          <div className="mt-4 space-y-3">
            {recentResults.map((item) => (
              <div key={item.subject} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.subject}</p>
                  <p className="text-sm text-slate-500">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{item.score}</p>
                  <p className="text-sm text-slate-500">Rank {item.rank}</p>
                </div>
              </div>
            ))}
          </div>
        </ReusableCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <ReusableCard title="Notifications" subtitle="Important updates from your institute">
          <div className="mt-4 space-y-3">
            {notificationsData.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FaBell /> {item.title}</div>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                <p className="mt-2 text-xs text-slate-400">{item.time}</p>
              </div>
            ))}
          </div>
        </ReusableCard>
        <ReusableCard title="Academic Calendar" subtitle="This month at a glance">
          <div className="mt-4 grid gap-3">
            {['Aug 12: OS revision', 'Aug 14: Practical', 'Aug 18: Feedback', 'Aug 20: Final exam'].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </ReusableCard>
      </div>
    </div>
  );
}
