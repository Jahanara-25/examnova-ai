import { useEffect, useMemo, useState } from 'react';
import { PageHeader, ReusableTable, SearchBar, EmptyState, ReusableButton } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';

const PAGE_SIZE = 10;

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api('/students');
      if (!Array.isArray(data?.students)) throw new Error('Student service returned an invalid response.');
      setStudents(data.students);
    } catch (requestError) { setError(requestError.message || 'Unable to load students.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [query]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return students.filter((student) => !normalized || `${student.name || ''} ${student.department || ''} ${student.rollNumber || ''}`.toLocaleLowerCase().includes(normalized));
  }, [students, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((student) => ({
    ...student,
    departmentLabel: student.department || 'Not provided',
    performance: student.average == null ? 'No published results' : `${student.average}% average`,
    status: student.examsAttempted ? `${student.examsAttempted} evaluated exam(s)` : 'No evaluated exams',
  }));
  const columns = [
    { key: 'name', header: 'Student' }, { key: 'rollNumber', header: 'Roll Number' },
    { key: 'departmentLabel', header: 'Department' }, { key: 'performance', header: 'Performance' }, { key: 'status', header: 'Status' },
  ];

  return <div className="space-y-6">
    <PageHeader title="Student Management" subtitle="Real student records in departments linked to your exams" action={<ReusableButton variant="secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</ReusableButton>} />
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/30 p-3 text-rose-200"><span>{error}</span><ReusableButton variant="secondary" onClick={load}>Retry</ReusableButton></div>}
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/40 to-slate-900/20 p-5 shadow-lg"><SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, roll number or department" /></div>
    {loading ? <div role="status" className="rounded-2xl border border-blue-500/20 p-8 text-center text-slate-300">Loading students from your authorized departments…</div> : error ? null : rows.length ? <><ReusableTable columns={columns} data={rows} /><div className="flex items-center justify-between text-sm text-slate-300"><span>{filtered.length} student(s) · Page {page} of {pages}</span><div className="flex gap-2"><ReusableButton variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</ReusableButton><ReusableButton variant="secondary" disabled={page >= pages} onClick={() => setPage((current) => Math.min(pages, current + 1))}>Next</ReusableButton></div></div></> : <EmptyState title={students.length ? 'No students match this search.' : 'No students in your authorized departments yet.'} message={students.length ? 'Clear or change the search to see more records.' : 'Student records appear here when they belong to a department associated with your teacher account or exams.'} />}
  </div>;
}
