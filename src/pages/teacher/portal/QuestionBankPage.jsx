import { useMemo, useState } from 'react';
import { FaFilter, FaPlus, FaDownload, FaUpload, FaEdit, FaTrash } from 'react-icons/fa';
import { PageHeader, SearchBar, ReusableButton, ReusableCard, ReusableTable, ReusableForm, FormField, ConfirmDialog, EmptyState } from '../../../components/ui/PortalUI';
import { teacherQuestions } from '../../../data/mockData';

export default function QuestionBankPage() {
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [questions, setQuestions] = useState(teacherQuestions);

  const filtered = useMemo(() => questions.filter((question) => `${question.title} ${question.subject}`.toLowerCase().includes(query.toLowerCase())), [query, questions]);

  const columns = [
    { key: 'title', header: 'Question' },
    { key: 'subject', header: 'Subject' },
    { key: 'difficulty', header: 'Difficulty' },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <ReusableButton variant="secondary" onClick={() => setShowForm(true)}>Edit</ReusableButton>
          <ReusableButton variant="danger" onClick={() => setDeleteTarget(row)}>Delete</ReusableButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Question Bank" subtitle="Manage, import, and export assessment questions" action={<div className="flex gap-3"><ReusableButton variant="secondary"><FaUpload className="mr-2 inline" /> Import</ReusableButton><ReusableButton><FaPlus className="mr-2 inline" /> New Question</ReusableButton></div>} />

      <ReusableCard title="Search and filters" subtitle="Find questions quickly">
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title or subject" />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <FaFilter />
              <select className="border-none bg-transparent outline-none">
                <option>All</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
            <ReusableButton variant="secondary"><FaDownload className="mr-2 inline" /> Export</ReusableButton>
          </div>
        </div>
      </ReusableCard>

      {filtered.length > 0 ? <ReusableTable columns={columns} data={filtered} /> : <EmptyState title="No questions found" message="Try another search or add new questions." action={<ReusableButton onClick={() => setShowForm(true)}>Create Question</ReusableButton>} />}

      {showForm && <ReusableForm title="Create / Edit Question" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Question Title"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
          <FormField label="Subject"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
          <FormField label="Difficulty"><select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option>Easy</option><option>Medium</option><option>Hard</option></select></FormField>
          <FormField label="Status"><select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option>Draft</option><option>Approved</option></select></FormField>
        </div>
        <ReusableButton>Save Question</ReusableButton>
      </ReusableForm>}

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete Question" message={`Delete ${deleteTarget?.title || 'this question'} from the bank?`} onConfirm={() => { setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id)); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
