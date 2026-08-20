import { useState } from 'react';
import { FaUpload, FaMagic, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';

export default function AiQuestionGeneratorPage() {
  const [questions, setQuestions] = useState([{ id: 1, prompt: 'Explain the difference between recursion and iteration.', status: 'Generated' }]);
  return (
    <div className="space-y-6">
      <PageHeader title="AI Question Generator" subtitle="Upload a PDF or text source and create questions" action={<ReusableButton><FaMagic className="mr-2 inline" /> Generate Questions</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ReusableCard title="Upload Source" subtitle="PDF, notes, or chapter content">
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <FaUpload className="mx-auto text-4xl text-slate-400" />
            <p className="mt-3 text-sm text-slate-600">Drop lesson PDF here or browse files.</p>
            <ReusableButton variant="secondary" className="mt-4">Select File</ReusableButton>
          </div>
        </ReusableCard>
        <ReusableCard title="Review Generated Questions" subtitle="Approve or reject suggestions">
          <div className="mt-4 space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{question.prompt}</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{question.status}</span>
                </div>
                <div className="mt-3 flex gap-3">
                  <ReusableButton variant="secondary"><FaCheckCircle className="mr-2 inline" /> Approve</ReusableButton>
                  <ReusableButton variant="danger"><FaTimesCircle className="mr-2 inline" /> Reject</ReusableButton>
                </div>
              </div>
            ))}
          </div>
        </ReusableCard>
      </div>
      <ReusableForm title="Generate New Set">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Subject"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
          <FormField label="Difficulty"><select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option>Medium</option><option>Easy</option><option>Hard</option></select></FormField>
        </div>
        <ReusableButton>Save Questions</ReusableButton>
      </ReusableForm>
    </div>
  );
}
