import { PageHeader, ReusableButton, ReusableCard, ReusableTable } from '../../../components/ui/PortalUI';
import { studentManagementData } from '../../../data/mockData';

const columns = [
  { key: 'name', header: 'Student' },
  { key: 'batch', header: 'Batch' },
  { key: 'performance', header: 'Performance' },
  { key: 'status', header: 'Status' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Student and subject reports" action={<ReusableButton>Download Pack</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ReusableCard title="Student Reports" subtitle="Per-student summaries">
          <ReusableTable columns={columns} data={studentManagementData} />
        </ReusableCard>
        <ReusableCard title="Subject Reports" subtitle="Performance distribution">
          <div className="mt-4 space-y-3">
            {['Operating Systems', 'DBMS', 'Machine Learning'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{item} • Average score 88%</div>
            ))}
          </div>
        </ReusableCard>
      </div>
    </div>
  );
}
