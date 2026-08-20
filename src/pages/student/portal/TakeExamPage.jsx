import { useState } from 'react';
import { FaClock, FaCheckCircle, FaFlag, FaArrowRight, FaArrowLeft, FaCamera } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';

const questions = [
  { id: 1, type: 'MCQ', prompt: 'Which data structure follows LIFO order?', options: ['Queue', 'Stack', 'Heap', 'Tree'] },
  { id: 2, type: 'Descriptive', prompt: 'Explain the role of indexing in database performance.' },
  { id: 3, type: 'Coding', prompt: 'Write a function to reverse a linked list.' },
];

export default function TakeExamPage() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const question = questions[current];

  return (
    <div className="space-y-6">
      <PageHeader title="Take Exam" subtitle="Secure exam experience with timer, review, and autosave" action={<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"><FaClock className="mr-2 inline" /> 00:42:18</div>} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ReusableCard title={`Question ${question.id}`} subtitle={`${question.type} • Auto-saved • Tab-switch warning placeholder`}>
          <div className="mt-5 space-y-4">
            <p className="text-lg font-semibold text-slate-900">{question.prompt}</p>
            {question.type === 'MCQ' ? (
              <div className="grid gap-3">
                {question.options.map((option) => (
                  <button key={option} onClick={() => setAnswers({ ...answers, [question.id]: option })} className={`rounded-2xl border px-4 py-3 text-left text-sm ${answers[question.id] === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                    {option}
                  </button>
                ))}
              </div>
            ) : question.type === 'Descriptive' ? (
              <ReusableForm title="Response">
                <FormField label="Write your answer">
                  <textarea rows="5" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none" placeholder="Compose your response here" />
                </FormField>
              </ReusableForm>
            ) : (
              <ReusableForm title="Coding Solution">
                <FormField label="Code">
                  <textarea rows="6" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none" placeholder="function solve() {}" />
                </FormField>
              </ReusableForm>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ReusableButton variant="secondary" onClick={() => setCurrent((prev) => Math.max(prev - 1, 0))}><FaArrowLeft className="mr-2 inline" /> Previous</ReusableButton>
            <ReusableButton variant="secondary" onClick={() => setReview((prev) => prev.includes(question.id) ? prev.filter((id) => id !== question.id) : [...prev, question.id])}><FaFlag className="mr-2 inline" />{review.includes(question.id) ? 'Marked' : 'Mark for Review'}</ReusableButton>
            <ReusableButton onClick={() => setCurrent((prev) => Math.min(prev + 1, questions.length - 1))}>Next <FaArrowRight className="ml-2 inline" /></ReusableButton>
          </div>
        </ReusableCard>

        <div className="space-y-6">
          <ReusableCard title="Question Palette" subtitle="Jump between questions">
            <div className="mt-4 grid grid-cols-4 gap-3">
              {questions.map((item, index) => (
                <button key={item.id} onClick={() => setCurrent(index)} className={`rounded-2xl border px-3 py-3 text-sm ${current === index ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                  {item.id}
                </button>
              ))}
            </div>
          </ReusableCard>
          <ReusableCard title="Exam Controls" subtitle="Security and submission">
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3"><FaCheckCircle className="text-emerald-600" /> Auto save is active</div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3"><FaCamera className="text-slate-600" /> Face detection placeholder enabled</div>
              <ReusableButton variant="success" className="w-full" onClick={() => setSubmitted(true)}>Submit Exam</ReusableButton>
            </div>
          </ReusableCard>
          {submitted && <ReusableCard title="Submission Confirmed" subtitle="Your exam is securely submitted."><p className="text-sm text-slate-600">You will receive a confirmation and result update shortly.</p></ReusableCard>}
        </div>
      </div>
    </div>
  );
}
