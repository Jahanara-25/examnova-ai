import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField, EmptyState } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';

const blank = { questionText: '', questionType: 'mcq', options: ['', '', '', ''], correctAnswer: '', marks: 1, section: '', answerScheme: '' };
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900';
const createDraftKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const normalizeQuestion = (question) => ({ ...blank, ...question, options: question.questionType === 'mcq' ? Array.from({ length: 4 }, (_, index) => question.options?.[index] || '') : ['', '', '', ''], marks: Number(question.marks) || 1 });

export default function QuestionPaperGeneratorPage() {
  const [exams, setExams] = useState([]);
  const [examError, setExamError] = useState('');
  const [examId, setExamId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionError, setQuestionError] = useState('');
  const [draftQuestions, setDraftQuestions] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState('');
  const [draftEditingIndex, setDraftEditingIndex] = useState(-1);
  const [paperTitle, setPaperTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [targetTotal, setTargetTotal] = useState('');
  const [message, setMessage] = useState('');
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pdf, setPdf] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const questionRequestId = useRef(0);
  const actionInProgress = useRef(false);
  const navigate = useNavigate();

  const selected = exams.find((exam) => exam._id === examId);
  const total = useMemo(() => [...questions, ...draftQuestions].reduce((sum, question) => sum + Number(question.marks || 0), 0), [questions, draftQuestions]);
  const target = Number(targetTotal);
  const remaining = target - total;
  const settingsDirty = Boolean(selected) && (paperTitle.trim() !== selected.title || instructions.trim() !== (selected.instructions || '') || target !== selected.totalMarks);

  const loadExams = async () => {
    setLoadingExams(true); setMessage(''); setExamError('');
    try {
      const data = await api('/exams/mine');
      if (!Array.isArray(data.exams)) throw new Error('The exams endpoint returned an unexpected response. Refresh and retry.');
      setExams(data.exams.filter((exam) => String(exam.status || '').toLowerCase() === 'draft'));
    }
    catch (error) { setExams([]); setExamError(error.message || 'Unable to load your draft exams.'); }
    finally { setLoadingExams(false); }
  };
  const loadQuestions = async (id) => {
    const requestId = ++questionRequestId.current;
    if (!id) { setQuestions([]); setQuestionError(''); setLoadingQuestions(false); return; }
    setQuestions([]);
    setLoadingQuestions(true);
    setQuestionError('');
    try {
      const data = await api(`/questions?examId=${encodeURIComponent(id)}`);
      if (!Array.isArray(data.questions)) throw new Error('The questions endpoint returned an unexpected response.');
      if (requestId === questionRequestId.current) setQuestions(data.questions.slice().sort((a, b) => a.order - b.order));
    } catch (error) {
      if (requestId === questionRequestId.current) { setQuestions([]); setQuestionError(error.message || 'Unable to load saved draft questions.'); }
    } finally {
      if (requestId === questionRequestId.current) setLoadingQuestions(false);
    }
  };
  useEffect(() => { loadExams(); }, []);
  useEffect(() => {
    const exam = exams.find((item) => item._id === examId);
    if (!exam) { setQuestions([]); setDraftQuestions([]); setQuestionError(''); setLoadingQuestions(false); return; }
    setPaperTitle(exam.title || ''); setInstructions(exam.instructions || ''); setTargetTotal(String(exam.totalMarks));
    setDraftQuestions([]); setForm(blank); setEditingId(''); setDraftEditingIndex(-1); setPreview(false); setPdf(null);
    loadQuestions(examId);
  }, [examId]);

  const selectExam = (id) => { questionRequestId.current += 1; setQuestions([]); setQuestionError(''); setDraftQuestions([]); setLoadingQuestions(false); setExamId(id); setMessage(''); };
  const saveSettings = async () => {
    if (!selected || actionInProgress.current) return;
    if (!paperTitle.trim() || !Number.isInteger(target) || target < 1) { setMessage('Enter a paper title and a positive whole-number total.'); return; }
    actionInProgress.current = true; setBusy(true);
    try {
      const data = await api(`/exams/${examId}`, { method: 'PATCH', body: JSON.stringify({ title: paperTitle.trim(), instructions: instructions.trim(), totalMarks: target }) });
      setExams((current) => current.map((exam) => exam._id === examId ? data.exam : exam));
      setMessage('Draft title, instructions, and target total saved.');
    } catch (error) { setMessage(error.message || 'Unable to save paper settings.'); }
    finally { actionInProgress.current = false; setBusy(false); }
  };

  const uploadPdf = async (event) => {
    event.preventDefault();
    if (!selected || !pdf || extracting || actionInProgress.current) return;
    if (!pdf.size) { setMessage('The selected PDF is empty. Choose a readable PDF and try again.'); return; }
    if (pdf.size > 10 * 1024 * 1024) { setMessage('The PDF is larger than the 10 MB upload limit. Choose a smaller file.'); return; }
    if (pdf.type && pdf.type !== 'application/pdf' && !pdf.name.toLowerCase().endsWith('.pdf')) { setMessage('Choose a PDF file.'); return; }
    const body = new FormData(); body.append('examId', examId); body.append('paper', pdf);
    actionInProgress.current = true; setExtracting(true); setMessage('Extracting question text from the PDF…');
    try {
      const result = await api('/question-papers/extract-pdf', { method: 'POST', body });
      const imported = (result.questions || []).map((question) => normalizeQuestion({ ...question, source: 'paper', paperDraftKey: createDraftKey() }));
      if (!imported.length) throw new Error('No questions were returned. You can continue with manual entry.');
      setDraftQuestions((current) => [...current, ...imported]);
      setPdf(null); event.currentTarget.reset();
      setMessage(`Extracted ${imported.length} question(s) from ${result.sourceName}. Review and correct them before saving.`);
    } catch (error) { setMessage(error.message || 'Could not extract this PDF.'); }
    finally { actionInProgress.current = false; setExtracting(false); }
  };

  const validateQuestion = (question) => {
    if (!question.questionText?.trim()) return 'Enter the question text.';
    if (!Number.isInteger(Number(question.marks)) || Number(question.marks) < 1 || Number(question.marks) > 5) return 'Each question must be worth 1 to 5 whole marks.';
    if (question.questionType === 'mcq' && (question.options.length !== 4 || question.options.some((option) => !option.trim()) || new Set(question.options).size !== 4 || !question.options.includes(question.correctAnswer))) return 'MCQs need four distinct options and a selected correct answer.';
    return '';
  };
  const saveQuestion = (event) => {
    event.preventDefault();
    if (!selected || actionInProgress.current) return;
    const question = { ...form, paperDraftKey: form.paperDraftKey || createDraftKey(), questionText: form.questionText.trim(), section: form.section.trim(), answerScheme: form.answerScheme.trim(), marks: Number(form.marks), source: 'paper', options: form.questionType === 'mcq' ? form.options : [], correctAnswer: form.questionType === 'mcq' ? form.correctAnswer : '' };
    const validation = validateQuestion(question);
    if (validation) { setMessage(validation); return; }
    if (editingId) { savePersistedEdit(question); return; }
    setDraftQuestions((current) => draftEditingIndex >= 0 ? current.map((item, index) => index === draftEditingIndex ? question : item) : [...current, question]);
    setForm(blank); setDraftEditingIndex(-1); setMessage('Question added to review. Save reviewed questions to attach it to the draft.');
  };
  const savePersistedEdit = async (question) => {
    actionInProgress.current = true; setBusy(true);
    try { await api(`/questions/${editingId}`, { method: 'PATCH', body: JSON.stringify({ ...question, examId }) }); setEditingId(''); setForm(blank); setMessage('Saved question updated.'); await loadQuestions(examId); }
    catch (error) { setMessage(error.message || 'Unable to update this question.'); }
    finally { actionInProgress.current = false; setBusy(false); }
  };
  const saveReviewedQuestions = async () => {
    if (!selected || !draftQuestions.length || actionInProgress.current) return;
    const invalidIndex = draftQuestions.findIndex((question) => validateQuestion(question));
    if (invalidIndex >= 0) { setMessage(`Review question ${invalidIndex + 1}: ${validateQuestion(draftQuestions[invalidIndex])}`); return; }
    actionInProgress.current = true; setBusy(true); let savedCount = 0;
    try {
      while (savedCount < draftQuestions.length) {
        const question = draftQuestions[savedCount];
        await api('/questions', { method: 'POST', body: JSON.stringify({ ...question, examId, order: questions.length + savedCount }) });
        savedCount += 1;
      }
      setDraftQuestions([]); setMessage(`Saved ${savedCount} reviewed question(s) to the selected draft.`); await loadQuestions(examId);
    } catch (error) {
      setDraftQuestions((current) => current.slice(savedCount));
      setMessage(`${error.message || 'Question save failed.'} ${savedCount} item(s) saved; unsaved review items remain available.`);
      await loadQuestions(examId);
    } finally { actionInProgress.current = false; setBusy(false); }
  };

  const editQuestion = (question) => { setEditingId(question._id); setDraftEditingIndex(-1); setForm(normalizeQuestion(question)); };
  const editDraft = (index) => { setDraftEditingIndex(index); setEditingId(''); setForm(normalizeQuestion(draftQuestions[index])); };
  const persistOrder = async (orderedQuestions) => {
    for (const [order, question] of orderedQuestions.entries()) await api(`/questions/${question._id}`, { method: 'PATCH', body: JSON.stringify({ order }) });
    return orderedQuestions.map((question, order) => ({ ...question, order }));
  };
  const removeQuestion = async (question) => {
    if (actionInProgress.current) return;
    actionInProgress.current = true; setBusy(true);
    try { await api(`/questions/${question._id}`, { method: 'DELETE' }); setQuestions(await persistOrder(questions.filter((item) => item._id !== question._id))); setMessage('Question removed from the draft.'); }
    catch (error) { await loadQuestions(examId); setMessage(error.message || 'Question removal failed.'); }
    finally { actionInProgress.current = false; setBusy(false); }
  };
  const moveQuestion = async (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= questions.length || actionInProgress.current) return;
    const next = [...questions]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    actionInProgress.current = true; setBusy(true);
    try { setQuestions(await persistOrder(next)); setMessage('Question order saved.'); }
    catch (error) { await loadQuestions(examId); setMessage(error.message || 'Unable to save question order.'); }
    finally { actionInProgress.current = false; setBusy(false); }
  };
  const publish = async () => {
    if (!selected || actionInProgress.current) return;
    if (settingsDirty) { setMessage('Save Paper Settings before publishing.'); return; }
    if (!paperTitle.trim() || !Number.isInteger(target) || target < 1 || target !== Number(selected.totalMarks)) { setMessage('Enter a valid paper title and target total, then save the paper settings.'); return; }
    if (loadingQuestions) { setMessage('Wait for saved questions to finish loading, then publish.'); return; }
    if (draftQuestions.length) { setMessage('Save or remove the questions still in review before publishing.'); return; }
    if (!questions.length) { setMessage('Add and save at least one question before publishing.'); return; }
    if (total !== target) { setMessage(`Question marks total ${total}; the configured paper total is ${target}. Adjust the questions or target total to match.`); return; }
    actionInProgress.current = true; setBusy(true);
    try { await api(`/exams/${examId}/publish`, { method: 'POST' }); questionRequestId.current += 1; setExamId(''); setQuestions([]); setDraftQuestions([]); await loadExams(); setMessage('Question paper published. Students can access it through the existing exam schedule.'); }
    catch (error) { setMessage(error.message || 'Unable to publish this paper.'); }
    finally { actionInProgress.current = false; setBusy(false); }
  };

  const renderQuestionEditor = (question, onChange) => <div className="mt-3 grid gap-3 md:grid-cols-2">
        <FormField label="Question type"><select value={question.questionType} onChange={(event) => onChange({ ...question, questionType: event.target.value, options: event.target.value === 'mcq' ? ['', '', '', ''] : [], correctAnswer: '' })} className={inputClass}><option value="mcq">Multiple choice</option><option value="very-short-answer">Very short answer</option><option value="short-answer">Short answer</option><option value="descriptive">Descriptive / long answer</option></select></FormField>
    <FormField label="Marks (1–5)"><select value={question.marks} onChange={(event) => onChange({ ...question, marks: Number(event.target.value) })} className={inputClass}>{[1, 2, 3, 4, 5].map((mark) => <option key={mark} value={mark}>{mark}</option>)}</select></FormField>
    <FormField label="Section (optional)"><input value={question.section || ''} onChange={(event) => onChange({ ...question, section: event.target.value })} className={inputClass} placeholder="e.g. Section A" /></FormField>
    <FormField label="Question text"><textarea value={question.questionText} onChange={(event) => onChange({ ...question, questionText: event.target.value })} className={inputClass} rows={3} /></FormField>
    {question.questionType === 'mcq' && <div className="md:col-span-2"><div className="grid gap-3 sm:grid-cols-2">{question.options.map((option, index) => <FormField key={index} label={`Option ${String.fromCharCode(65 + index)}`}><input value={option} onChange={(event) => { const options = [...question.options]; const old = options[index]; options[index] = event.target.value; onChange({ ...question, options, correctAnswer: question.correctAnswer === old ? event.target.value : question.correctAnswer }); }} className={inputClass} /></FormField>)}</div><FormField label="Correct answer"><select value={question.correctAnswer} onChange={(event) => onChange({ ...question, correctAnswer: event.target.value })} className={inputClass}><option value="">Select correct option</option>{question.options.filter(Boolean).map((option, index) => <option key={`${index}-${option}`} value={option}>{String.fromCharCode(65 + index)}. {option}</option>)}</select></FormField></div>}
    {question.questionType !== 'mcq' && <div className="md:col-span-2"><FormField label="Answer / marking scheme (teacher only)"><textarea value={question.answerScheme || ''} onChange={(event) => onChange({ ...question, answerScheme: event.target.value })} className={inputClass} rows={3} placeholder="Optional guidance for teacher evaluation" /></FormField></div>}
  </div>;

  return <div className="space-y-6">
    <PageHeader title="Question Paper Generator" subtitle="Build a paper manually or review questions extracted from a PDF" />
    <ReusableCard title="Select and configure draft paper">
      <FormField label="Select draft exam"><select value={examId} disabled={busy || loadingExams} onChange={(event) => selectExam(event.target.value)} className={inputClass}><option value="">Select a draft exam</option>{exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title} · {exam.totalMarks} marks</option>)}</select></FormField>
      {loadingExams && <p role="status" className="mt-2">Loading your exams…</p>}
      {examId && loadingQuestions && <p role="status" className="mt-2">Loading questions for this draft…</p>}
      {selected && <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField label="Paper / exam title"><input value={paperTitle} onChange={(event) => setPaperTitle(event.target.value)} className={inputClass} /></FormField>
        <FormField label="Configured target total (marks)"><input type="number" min="1" step="1" value={targetTotal} onChange={(event) => setTargetTotal(event.target.value)} className={inputClass} /></FormField>
        <div className="md:col-span-2"><FormField label="Exam instructions"><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} className={inputClass} rows={2} /></FormField></div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3"><ReusableButton variant="secondary" onClick={saveSettings} disabled={busy}>Save Paper Settings</ReusableButton><p>Saved questions: <b>{questions.reduce((sum, question) => sum + Number(question.marks || 0), 0)}</b>; in review: <b>{draftQuestions.reduce((sum, question) => sum + Number(question.marks || 0), 0)}</b>; total: <b>{total} / {target || 0}</b>; {remaining >= 0 ? `${remaining} marks remaining` : `${Math.abs(remaining)} marks over`}</p></div>
      </div>}
      {examError && <div className="mt-4 flex flex-wrap items-center gap-3" role="alert"><p>{examError}</p><ReusableButton variant="secondary" onClick={loadExams} disabled={loadingExams}>Retry</ReusableButton></div>}
      {!loadingExams && !examError && !exams.length && <div className="mt-4 space-y-3"><EmptyState title="No draft exams available." message="Create a real draft exam first, then return here to add its paper. No exam data has been prefilled." /><ReusableButton onClick={() => navigate('/teacher/exam-management')}>Create Draft Exam</ReusableButton></div>}
    </ReusableCard>

    {selected && <div className="grid gap-6 lg:grid-cols-2">
      <ReusableCard title="Method 1 · AI Question Paper Generator" subtitle="Text-based PDF extraction only. Scanned image PDFs need OCR, which is not configured.">
        <form onSubmit={uploadPdf} className="space-y-4"><FormField label="Question paper PDF (maximum 10 MB)"><input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => { const file = event.target.files?.[0] || null; setPdf(file); setMessage(file && ((file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) || file.size > 10 * 1024 * 1024) ? 'Choose a valid PDF no larger than 10 MB.' : ''); }} className="block w-full text-sm text-slate-200" /></FormField><ReusableButton type="submit" disabled={!pdf || extracting || busy}>{extracting ? 'Extracting…' : 'Extract for Review'}</ReusableButton></form>
      </ReusableCard>
      <ReusableForm title={`${editingId || draftEditingIndex >= 0 ? 'Edit' : 'Method 2 · Add'} Question`} onSubmit={saveQuestion}>
        <FormField label="Question type"><select value={form.questionType} onChange={(event) => setForm((current) => ({ ...current, questionType: event.target.value, options: event.target.value === 'mcq' ? ['', '', '', ''] : [], correctAnswer: '' }))} className={inputClass}><option value="mcq">Multiple choice</option><option value="very-short-answer">Very short answer</option><option value="short-answer">Short answer</option><option value="descriptive">Descriptive / long answer</option></select></FormField>
        <FormField label="Question text"><textarea required value={form.questionText} onChange={(event) => setForm((current) => ({ ...current, questionText: event.target.value }))} className={inputClass} rows={3} /></FormField>
        <div className="grid gap-3 sm:grid-cols-2"><FormField label="Section (optional)"><input value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className={inputClass} placeholder="e.g. Section A" /></FormField><FormField label="Marks (1–5)"><select value={form.marks} onChange={(event) => setForm((current) => ({ ...current, marks: Number(event.target.value) }))} className={inputClass}>{[1, 2, 3, 4, 5].map((mark) => <option key={mark}>{mark}</option>)}</select></FormField></div>
        {form.questionType === 'mcq' && <div className="grid gap-3 sm:grid-cols-2">{form.options.map((option, index) => <FormField key={index} label={`Option ${String.fromCharCode(65 + index)}`}><input required value={option} onChange={(event) => setForm((current) => { const options = [...current.options]; const old = options[index]; options[index] = event.target.value; return { ...current, options, correctAnswer: current.correctAnswer === old ? event.target.value : current.correctAnswer }; })} className={inputClass} /></FormField>)}<FormField label="Correct answer"><select required value={form.correctAnswer} onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))} className={inputClass}><option value="">Select correct option</option>{form.options.filter(Boolean).map((option, index) => <option key={`${index}-${option}`} value={option}>{String.fromCharCode(65 + index)}. {option}</option>)}</select></FormField></div>}
        {form.questionType !== 'mcq' && <FormField label="Answer / marking scheme (teacher only)"><textarea value={form.answerScheme} onChange={(event) => setForm((current) => ({ ...current, answerScheme: event.target.value }))} className={inputClass} rows={3} /></FormField>}
        <div className="flex flex-wrap gap-2"><ReusableButton type="submit" disabled={busy}>{editingId || draftEditingIndex >= 0 ? 'Update Review Question' : 'Add to Review'}</ReusableButton>{(editingId || draftEditingIndex >= 0) && <ReusableButton type="button" variant="secondary" onClick={() => { setEditingId(''); setDraftEditingIndex(-1); setForm(blank); }}>Cancel Edit</ReusableButton>}</div>
      </ReusableForm>
    </div>}

    {message && <p role="status" className="text-cyan-200">{message}</p>}
    {selected && draftQuestions.length > 0 && <ReusableCard title={`Review before saving · ${draftQuestions.length} question(s)`} subtitle="These extracted or manually entered questions are not saved until you choose Save Reviewed Questions.">
      <div className="space-y-4">{draftQuestions.map((question, index) => <article key={`draft-${index}`} className="rounded-xl border border-blue-400/20 p-4 text-slate-200"><div className="flex items-start justify-between gap-3"><b>{index + 1}. {question.questionText || 'Question text required'}</b><span>{question.marks} mark(s)</span></div>{renderQuestionEditor(question, (next) => setDraftQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? next : item)))}<div className="mt-3 flex flex-wrap gap-2"><ReusableButton type="button" variant="secondary" disabled={index === 0} onClick={() => setDraftQuestions((current) => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} aria-label={`Move review question ${index + 1} up`}>Move up</ReusableButton><ReusableButton type="button" variant="secondary" disabled={index === draftQuestions.length - 1} onClick={() => setDraftQuestions((current) => { const next = [...current]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })} aria-label={`Move review question ${index + 1} down`}>Move down</ReusableButton><ReusableButton type="button" variant="secondary" onClick={() => editDraft(index)}>Edit in question form</ReusableButton><ReusableButton type="button" variant="secondary" onClick={() => setDraftQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</ReusableButton></div></article>)}
        <ReusableButton onClick={saveReviewedQuestions} disabled={busy}>{busy ? 'Saving reviewed questions…' : `Save ${draftQuestions.length} Reviewed Question(s)`}</ReusableButton></div>
    </ReusableCard>}

    {selected && <div className="flex flex-wrap gap-2"><ReusableButton variant="secondary" onClick={() => loadQuestions(examId)} disabled={busy || loadingQuestions}>Reload Saved Draft</ReusableButton><ReusableButton variant="secondary" onClick={() => setPreview((value) => !value)} disabled={!questions.length && !draftQuestions.length}>{preview ? 'Close Preview' : 'Preview Paper'}</ReusableButton><ReusableButton variant="success" onClick={publish} disabled={busy}>{busy ? 'Publishing…' : 'Publish Paper'}</ReusableButton></div>}
    {preview && selected && <ReusableCard title="Paper preview" subtitle={`${paperTitle} · ${selected.subject} · ${total} marks${draftQuestions.length ? ' · includes unsaved review questions' : ''}`}><div className="space-y-4 bg-white p-6 text-slate-900">{instructions && <p><b>Instructions:</b> {instructions}</p>}{[...questions, ...draftQuestions].map((question, index) => <section key={question._id || `draft-preview-${index}`} className="mb-4"><b>{index + 1}. {question.section ? `${question.section}: ` : ''}{question.questionText} ({question.marks} marks)</b>{question.questionType === 'mcq' ? <ol type="A" className="ml-6 list-[upper-alpha]">{question.options.map((option, optionIndex) => <li key={`${optionIndex}-${option}`}>{option || '[Option required]'}</li>)}</ol> : <div className="mt-3 h-14 border-b border-dashed border-slate-300" />}</section>)}</div></ReusableCard>}
    <ReusableCard title="Saved draft questions">{questionError ? <div role="alert" className="space-y-3"><p>{questionError}</p><ReusableButton variant="secondary" onClick={() => loadQuestions(examId)} disabled={loadingQuestions}>Retry loading saved questions</ReusableButton></div> : loadingQuestions ? <p role="status">Loading saved questions…</p> : questions.length ? <div className="space-y-3">{questions.map((question, index) => <article key={question._id} className="rounded-xl border border-blue-400/20 p-4 text-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><b>{index + 1}. {question.section ? `${question.section}: ` : ''}{question.questionText}</b><p className="text-sm text-slate-400">{question.questionType} · {question.marks} mark(s){question.answerScheme ? ' · marking scheme saved' : ''}</p>{question.questionType === 'mcq' && <p className="text-sm">Options: {(question.options || []).join(' · ')}</p>}</div><div className="flex gap-2"><button type="button" disabled={busy || index === 0} onClick={() => moveQuestion(index, -1)} aria-label={`Move question ${index + 1} up`} className="rounded border px-2 py-1 disabled:opacity-40">↑</button><button type="button" disabled={busy || index === questions.length - 1} onClick={() => moveQuestion(index, 1)} aria-label={`Move question ${index + 1} down`} className="rounded border px-2 py-1 disabled:opacity-40">↓</button><button type="button" disabled={busy} onClick={() => editQuestion(question)} className="rounded border px-3 py-1">Edit</button><button type="button" disabled={busy} onClick={() => removeQuestion(question)} className="rounded border border-rose-400/40 px-3 py-1 text-rose-300">Remove</button></div></div></article>)}</div> : <EmptyState title="No questions attached." message="Choose a draft exam, then add questions manually or extract them from a PDF." />}</ReusableCard>
  </div>;
}
