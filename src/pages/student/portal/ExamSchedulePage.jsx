import { useMemo, useState } from 'react';
import { FaFilter, FaCalendarAlt } from 'react-icons/fa';
import { PageHeader, SearchBar, ReusableButton, ReusableCard, ReusableTable, EmptyState } from '../../../components/ui/PortalUI';
import { examScheduleData } from '../../../data/mockData';

export default function ExamSchedulePage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    return examScheduleData.filter((exam) => (filter === 'All' ? true : exam.status === filter) && `${exam.title} ${exam.subject}`.toLowerCase().includes(query.toLowerCase()));
  }, [query, filter]);

  const columns = [
    { key: 'title', header: 'Exam' },
    { key: 'subject', header: 'Subject' },
    { key: 'date', header: 'Date' },
    { key: 'venue', header: 'Venue' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Exam Schedule" subtitle="Track exams, deadlines, and attendance milestones" action={<ReusableButton>Export Calendar</ReusableButton>} />
      <ReusableCard title="Find and filter exams" subtitle="Search by title or subject">
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exams" />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <FaFilter />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border-none bg-transparent outline-none">
                <option>All</option>
                <option>Upcoming</option>
                <option>Completed</option>
                <option>Missed</option>
              </select>
            </label>
            <ReusableButton variant="secondary">Add Reminder</ReusableButton>
          </div>
        </div>
      </ReusableCard>

      {filtered.length > 0 ? <ReusableTable columns={columns} data={filtered} /> : <EmptyState title="No exams match your filter" message="Try broadening your search or resetting the status filter." action={<ReusableButton variant="secondary">Reset</ReusableButton>} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <ReusableCard title="Upcoming Exams" subtitle="Next six days">
          <div className="mt-4 space-y-3">
            {examScheduleData.filter((exam) => exam.status === 'Upcoming').map((exam) => (
              <div key={exam.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{exam.title}</p>
                  <p className="text-sm text-slate-500">{exam.subject}</p>
                </div>
                <div className="text-right text-sm text-slate-500"><FaCalendarAlt className="mb-1" /> {exam.date}</div>
              </div>
            ))}
          </div>
        </ReusableCard>
        <ReusableCard title="Exam Summary" subtitle="Coverage for the term">
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-900 p-4 text-white">4 upcoming assessments • 1 missed • 2 completed</div>
            <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">Your preparation streak remains healthy with two focused revision windows this week.</div>
          </div>
        </ReusableCard>
      </div>
    </div>
  );
}
