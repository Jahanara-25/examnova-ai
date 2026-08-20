import { useState } from 'react';
import { FaPlus, FaEdit, FaUsers, FaClock } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';
import { teacherExams } from '../../../data/mockData';

export default function ExamManagementPage() {
  const [activeExam, setActiveExam] = useState(teacherExams[0]);
  return (
    <div className="space-y-6">
      <PageHeader title="Exam Management" subtitle="Create, schedule, and manage assessment sessions" action={<ReusableButton><FaPlus className="mr-2 inline" /> Create Exam</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ReusableCard title="Exam List" subtitle="Current and upcoming exams">
          <div className="mt-4 space-y-3">
            {teacherExams.map((exam) => (
              <button key={exam.id} onClick={() => setActiveExam(exam)} className={`w-full rounded-2xl border p-4 text-left ${activeExam.id === exam.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                <p className="font-semibold">{exam.title}</p>
                <p className="mt-1 text-sm opacity-80">{exam.subject} • {exam.date}</p>
              </button>
            ))}
          </div>
        </ReusableCard>
        <ReusableForm title="Exam Setup">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Title"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" defaultValue={activeExam.title} /></FormField>
            <FormField label="Subject"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" defaultValue={activeExam.subject} /></FormField>
            <FormField label="Schedule"><input type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
            <FormField label="Duration"><input type="number" defaultValue={activeExam.duration.replace(' mins', '')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
            <FormField label="Negative Marking"><select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option>Enabled</option><option>Disabled</option></select></FormField>
            <FormField label="Instructions"><textarea className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" defaultValue="Read all questions carefully" /></FormField>
          </div>
          <div className="mt-4 flex gap-3">
            <ReusableButton><FaEdit className="mr-2 inline" /> Edit Exam</ReusableButton>
            <ReusableButton variant="secondary"><FaUsers className="mr-2 inline" /> Assign Students</ReusableButton>
          </div>
        </ReusableForm>
      </div>
    </div>
  );
}
