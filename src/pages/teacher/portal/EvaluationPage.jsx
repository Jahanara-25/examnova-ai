import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';
import { evaluationQueue } from '../../../data/mockData';

export default function EvaluationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Evaluation" subtitle="Review descriptive, MCQ, and coding submissions" action={<ReusableButton>Submit Review</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <ReusableCard title="Evaluation Queue" subtitle="Pending reviews">
          <div className="mt-4 space-y-3">
            {evaluationQueue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.student}</p>
                <p className="text-sm text-slate-500">{item.subject} • {item.type}</p>
                <div className="mt-3 flex gap-3">
                  <ReusableButton variant="secondary">Review</ReusableButton>
                  <ReusableButton>Approve</ReusableButton>
                </div>
              </div>
            ))}
          </div>
        </ReusableCard>
        <ReusableForm title="Marks Entry">
          <div className="grid gap-4">
            <FormField label="Student"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
            <FormField label="Marks"><input type="number" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
            <FormField label="Feedback"><textarea className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
          </div>
          <ReusableButton>Save Evaluation</ReusableButton>
        </ReusableForm>
      </div>
    </div>
  );
}
