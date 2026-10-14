import { useEffect, useState } from 'react';
import { FaUpload, FaMagic, FaTimesCircle } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard, FormField, EmptyState } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900';

export default function AiQuestionGeneratorPage() {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [generatedMetadata, setGeneratedMetadata] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingExams, setLoadingExams] = useState(true);
  const [message, setMessage] = useState('');

  const loadExams = async () => {
    setLoadingExams(true);
    try { const data = await api('/exams/mine'); setExams((data.exams || []).filter((exam) => exam.status === 'draft')); }
    catch (error) { setMessage(error.message || 'Unable to load draft exams.'); }
    finally { setLoadingExams(false); }
  };
  useEffect(() => { loadExams(); }, []);

  const generate = async (event) => {
    event.preventDefault();
    if (!file || !subject.trim() || busy) return;
    setBusy(true); setMessage('Reading source and generating questions…');
    try {
      const body = new FormData(); body.append('source', file); body.append('subject', subject.trim()); body.append('difficulty', difficulty); body.append('count', String(count));
      const data = await api('/question-generation/generate', { method: 'POST', body });
      setQuestions((data.questions || []).map((question, index) => ({ ...question, id: `${Date.now()}-${index}`, saved: false })));
      setGeneratedMetadata({ subject: subject.trim(), difficulty });
      setMessage(`Generated ${data.questions.length} questions from ${data.sourceName}. Review and edit them before saving.`);
    } catch (error) { setMessage(error.message || 'Question generation failed.'); }
    finally { setBusy(false); }
  };

  const updateQuestion = (id, changes) => setQuestions((current) => current.map((question) => question.id === id ? { ...question, ...changes, saved: false } : question));
  const saveQuestions = async () => {
    if (!examId || busy) return;
    const pending = questions.filter((question) => !question.saved);
    if (!pending.length) { setMessage('All reviewed questions are already saved to the selected draft.'); return; }
    setBusy(true); let savedCount = 0;
    for (const question of pending) {
      try {
        await api('/questions', { method: 'POST', body: JSON.stringify({ examId, source: 'ai', questionText: question.questionText, questionType: 'mcq', options: question.options, correctAnswer: question.correctAnswer, marks: question.marks || 1, subject: generatedMetadata?.subject || subject.trim(), difficulty: generatedMetadata?.difficulty || difficulty }) });
        setQuestions((current) => current.map((item) => item.id === question.id ? { ...item, saved: true } : item)); savedCount += 1;
      } catch (error) {
        setMessage(`${savedCount} question(s) saved. The next question failed: ${error.message} You can retry; saved questions will not be sent again.`);
        setBusy(false); return;
      }
    }
    setMessage(`${savedCount} reviewed question(s) saved to your draft exam.`); setBusy(false);
  };

  return <div className="space-y-6">
    <PageHeader title="AI Question Generator" subtitle="Generate editable questions from your own PDF, DOCX, or TXT source" />
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <ReusableCard title="Upload Source" subtitle="Files are processed by the separate question-generation service, not the AI Chatbot.">
        <form onSubmit={generate} className="space-y-4">
          <FormField label="Source document"><input required type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => setFile(event.target.files?.[0] || null)} className={inputClass} /></FormField>
          <p className="text-xs text-slate-500">Maximum file size: 10 MB. Scanned image-only PDFs need OCR and are not supported.</p>
          <p className="text-xs text-slate-500">Extracted text is sent to the AI provider configured by your platform administrator. Add a provider key on the backend; no placeholder questions are shown when generation is unavailable.</p>
          <FormField label="Subject"><input required maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClass} /></FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Difficulty"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className={inputClass}><option value="easy">Easy</option><option value="medium">Medium / Normal</option><option value="hard">Hard / High</option></select></FormField>
            <FormField label="Question count"><select value={count} onChange={(event) => setCount(Number(event.target.value))} className={inputClass}>{[3, 5, 8, 10].map((value) => <option key={value} value={value}>{value}</option>)}</select></FormField>
          </div>
          <FormField label="Save reviewed questions to draft"><select value={examId} onChange={(event) => setExamId(event.target.value)} className={inputClass}><option value="">Select a draft exam</option>{exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title}</option>)}</select></FormField>
          {loadingExams && <p role="status">Loading your draft exams…</p>}
          <div className="flex flex-wrap gap-3"><ReusableButton type="submit" disabled={busy || !file || !subject.trim()}><FaMagic /> {busy ? 'Working…' : questions.length ? 'Regenerate Questions' : 'Generate Questions'}</ReusableButton><ReusableButton type="button" variant="secondary" onClick={loadExams} disabled={loadingExams}>Reload drafts</ReusableButton></div>
        </form>
      </ReusableCard>
      <ReusableCard title="Review Generated Questions" subtitle="Edit the question and all four options before saving.">
        {questions.length ? <div className="space-y-4">{questions.map((question, index) => <article key={question.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3"><b className="text-slate-800">Question {index + 1}</b><span className={question.saved ? 'text-emerald-700' : 'text-amber-700'}>{question.saved ? 'Saved to draft' : 'Needs review'}</span><button type="button" aria-label={`Remove question ${index + 1}`} onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}><FaTimesCircle /></button></div>
          <textarea aria-label={`Question ${index + 1} text`} value={question.questionText} onChange={(event) => updateQuestion(question.id, { questionText: event.target.value })} className={inputClass} rows={3} />
          <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2"><input type="radio" name={`answer-${question.id}`} checked={question.correctAnswer === option} onChange={() => updateQuestion(question.id, { correctAnswer: option })} aria-label={`Set option ${optionIndex + 1} as correct`} /><input value={option} aria-label={`Question ${index + 1} option ${optionIndex + 1}`} onChange={(event) => { const options = [...question.options]; const previous = options[optionIndex]; options[optionIndex] = event.target.value; updateQuestion(question.id, { options, correctAnswer: question.correctAnswer === previous ? event.target.value : question.correctAnswer }); }} className={inputClass} /></div>)}</div>
        </article>)}<ReusableButton disabled={!examId || busy || questions.every((question) => question.saved)} onClick={saveQuestions}>{busy ? 'Saving…' : 'Save Reviewed Questions'}</ReusableButton></div> : <EmptyState title="No generated questions to review." message="Upload a readable source, choose difficulty, and generate a question set." />}
      </ReusableCard>
    </div>
    {message && <p role="status" className="rounded-xl border border-cyan-500/20 p-3 text-cyan-200">{message}</p>}
  </div>;
}
