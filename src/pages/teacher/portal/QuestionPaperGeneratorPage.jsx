import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';

export default function QuestionPaperGeneratorPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Question Paper Generator" subtitle="Configure subjects, difficulty, and quantity" action={<ReusableButton>Preview Paper</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <ReusableForm title="Paper Configuration">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Subject"><select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option>Operating Systems</option><option>DBMS</option><option>ML</option></select></FormField>
            <FormField label="Difficulty"><select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option>Mixed</option><option>Easy</option><option>Hard</option></select></FormField>
            <FormField label="Number of Questions"><input type="number" defaultValue="25" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
            <FormField label="Duration (mins)"><input type="number" defaultValue="90" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
          </div>
          <ReusableButton>Publish Paper</ReusableButton>
        </ReusableForm>
        <ReusableCard title="Preview" subtitle="Paper structure overview">
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">10 MCQ questions • 10 descriptive • 5 coding</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Negative marking enabled • 1 mark deduction per wrong answer</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Instructions included for plagiarism and time management</div>
          </div>
        </ReusableCard>
      </div>
    </div>
  );
}
