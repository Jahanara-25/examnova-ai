import { FaChartLine, FaClipboardList, FaBookOpen, FaTasks, FaArrowRight } from 'react-icons/fa';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { PageHeader, StatCard, ReusableCard, ReusableButton } from '../../../components/ui/PortalUI';
import { teacherStats, teacherExams, evaluationQueue, analyticsData } from '../../../data/mockData';

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Teacher Dashboard" subtitle="Monitor assessments, questions, and student outcomes" action={<ReusableButton>Generate Report</ReusableButton>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {teacherStats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} subtitle={item.subtitle} icon={{ FaClipboardList, FaBookOpen, FaTasks, FaChartLine }[item.icon] || FaChartLine} accent={item.accent} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ReusableCard title="Performance Overview" subtitle="Class trend over recent months">
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
        <ReusableCard title="Upcoming Exams" subtitle="Scheduled this week">
          <div className="mt-4 space-y-3">
            {teacherExams.map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{exam.title}</p>
                <p className="text-sm text-slate-500">{exam.subject} • {exam.date} • {exam.duration}</p>
              </div>
            ))}
          </div>
        </ReusableCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ReusableCard title="Pending Evaluation" subtitle="Items awaiting review">
          <div className="mt-4 space-y-3">
            {evaluationQueue.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.student}</p>
                  <p className="text-sm text-slate-500">{item.subject} • {item.type}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{item.status}</span>
              </div>
            ))}
          </div>
        </ReusableCard>
        <ReusableCard title="Quick Actions" subtitle="Accelerate frequent tasks">
          <div className="mt-4 space-y-3">
            {['Create Question', 'Schedule Exam', 'Publish Report', 'Generate Certificate'].map((item) => (
              <button key={item} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">
                <span>{item}</span><FaArrowRight />
              </button>
            ))}
          </div>
        </ReusableCard>
      </div>
    </div>
  );
}
