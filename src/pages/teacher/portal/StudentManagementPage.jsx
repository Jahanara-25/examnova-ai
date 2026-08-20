import { useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard, ReusableTable, SearchBar } from '../../../components/ui/PortalUI';
import { studentManagementData } from '../../../data/mockData';

export default function StudentManagementPage() {
  const [query, setQuery] = useState('');
  const filtered = studentManagementData.filter((student) => `${student.name} ${student.batch}`.toLowerCase().includes(query.toLowerCase()));

  const columns = [
    { key: 'name', header: 'Student' },
    { key: 'batch', header: 'Batch' },
    { key: 'performance', header: 'Performance' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions', render: () => <ReusableButton variant="secondary">View</ReusableButton> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Student Management" subtitle="Track batch performance and student engagement" action={<ReusableButton>Export List</ReusableButton>} />
      <ReusableCard title="Find students" subtitle="Search and filter the roster">
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or batch" />
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <FaFilter />
            <select className="border-none bg-transparent outline-none"><option>All</option><option>Active</option><option>At Risk</option></select>
          </label>
        </div>
      </ReusableCard>
      <ReusableTable columns={columns} data={filtered} />
    </div>
  );
}
