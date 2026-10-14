import { useEffect, useState } from 'react';
import { PageHeader, ReusableCard, ReusableButton, ReusableForm, FormField, EmptyState } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function EvaluationPage() {
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [marks, setMarks] = useState({});
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/submissions/teacher/list');
      if (!Array.isArray(data?.submissions)) throw new Error('The server returned an invalid submissions response. Refresh the page or contact support.');
      setItems(data.submissions.filter((submission) => submission && typeof submission === 'object' && submission._id));
      setMessage('');
    } catch (error) {
      setItems([]);
      setMessage(error.message || 'Unable to load submitted exams.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []); // load is intentionally a one-time page request.
  const open = async (id) => {
    setRecordingUrl(''); setRecording(null); setRecordingLoading(true);
    try {
      const data = await api(`/submissions/teacher/${id}`);
      if (!data?.submission || typeof data.submission !== 'object' || !data?.exam || typeof data.exam !== 'object' || !Array.isArray(data.questions)) {
        throw new Error('The server returned incomplete evaluation details. Reload the submissions list and try again.');
      }
      const answers = Array.isArray(data.submission.answers) ? data.submission.answers.filter(Boolean) : [];
      const questions = data.questions.filter((question) => question && typeof question === 'object' && question._id);
      setDetail({ ...data, questions, submission: { ...data.submission, answers } }); setFeedback(data.submission.feedback || '');
      setMarks(Object.fromEntries(answers.filter((answer) => answer.questionId).map((answer) => [String(answer.questionId?._id || answer.questionId), { marksAwarded: answer.marksAwarded ?? '', feedback: answer.feedback || '' }])));
      try {
        const recordingData = await api(`/recordings/teacher/attempt/${id}`);
        setRecording(recordingData);
        if (recordingData?.recording?.status === 'complete') {
          const playback = await api(`/recordings/teacher/attempt/${id}/playback`, { method: 'POST' });
          if (typeof playback?.playbackUrl === 'string' && playback.playbackUrl.startsWith('/')) {
            setRecordingUrl(`${API_BASE.replace(/\/api\/?$/, '')}${playback.playbackUrl}`);
          }
        }
      } catch (error) {
        if (error.status === 404) setRecording({ recording: null, message: 'No recording metadata is available for this attempt.' });
        else setMessage(error.message || 'Unable to load recording review.');
      }
    } catch (error) { setMessage(error.message); }
    finally { setRecordingLoading(false); }
  };

  const save = async (finalize) => {
    if (!detail?.submission?._id) { setMessage('Open a valid submitted attempt before saving its evaluation.'); return; }
    if (saving) return;
    setSaving(true);
    try {
      await api(`/submissions/teacher/${detail.submission._id}/evaluate`, { method: 'POST', body: JSON.stringify({ answers: Object.entries(marks).map(([questionId, value]) => ({ questionId, ...value })), feedback, finalize }) });
      setMessage(finalize ? 'Evaluation finalized and result published.' : 'Evaluation saved.'); setDetail(null); load();
    } catch (error) { setMessage(error.message || 'Unable to save the evaluation.'); }
    finally { setSaving(false); }
  };

  const total = Object.values(marks).reduce((sum, value) => sum + (Number(value.marksAwarded) || 0), 0);
  const statusLabel = (status) => ({ pending: 'Pending', ready: 'Ready', recording: 'Recording', uploading: 'Uploading', interrupted: 'Interrupted', finalizing: 'Finalizing', complete: 'Complete', incomplete: 'Incomplete', failed: 'Failed' }[status] || status || 'Unavailable');

  return <div className="space-y-6">
    <PageHeader title="Evaluation" subtitle="Every mark is entered by the teacher—nothing is auto-graded" />
    {message && <p role="status" className="text-cyan-300">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      <ReusableCard title="Submitted Attempts">{loading ? <p role="status">Loading submitted exams…</p> : items.length ? items.filter((submission) => submission.examId).map((submission) => <button key={submission._id} onClick={() => open(submission._id)} className="mb-2 w-full rounded-xl border p-3 text-left text-slate-200"><b>{submission.studentId?.name || 'Student'}</b><br /><small>{submission.examId?.title || 'Exam'} · {submission.examId?.subject || 'Subject'} · {submission.evaluationStatus === 'evaluated' ? 'Evaluated' : submission.evaluationStatus === 'saved' ? 'Evaluation Saved' : 'Pending Evaluation'}</small></button>) : <EmptyState title="No student submissions yet." message="Submitted exam attempts awaiting evaluation will appear here." />}</ReusableCard>
      {detail && <div className="space-y-5">
        <ReusableCard title="Recording review" subtitle="Recording is review evidence only and does not determine marks or misconduct.">
          {recordingLoading ? <p role="status">Loading authorized recording details…</p> : recording?.recording ? <div className="space-y-3 text-slate-200">
            <p><b>Student:</b> {typeof recording.student?.name === 'string' ? recording.student.name : recording.student?.name?.name || 'Unavailable'} · <b>Exam:</b> {recording.exam?.title || detail.exam.title} · <b>Subject:</b> {recording.exam?.subject || detail.exam.subject}</p>
            <p><b>Status:</b> {statusLabel(recording.recording.status)} · <b>Duration:</b> {recording.recording.durationSeconds ? `${Math.floor(recording.recording.durationSeconds / 60)} min ${recording.recording.durationSeconds % 60} sec` : 'Unavailable'} · <b>Uploaded chunks:</b> {recording.recording.chunkCount}</p>
            <p><b>Started:</b> {recording.recording.startedAt ? new Date(recording.recording.startedAt).toLocaleString() : 'Unavailable'} · <b>Ended:</b> {recording.recording.endedAt ? new Date(recording.recording.endedAt).toLocaleString() : 'Unavailable'}</p>
            {recording.recording.status === 'complete' && recordingUrl ? <video controls preload="metadata" referrerPolicy="no-referrer" className="max-h-[65vh] w-full rounded-lg bg-black" src={recordingUrl}>Your browser cannot play this recording.</video> : <p role="status">{recording.recording.status === 'complete' ? 'Preparing secure playback…' : `Playback is unavailable: recording is ${statusLabel(recording.recording.status).toLowerCase()}. ${recording.recording.failureReason || ''}`}</p>}
          </div> : <p role="status">{recording?.message || 'No recording metadata is available for this attempt.'}</p>}
        </ReusableCard>
        <ReusableForm title={`Evaluate ${detail.submission.studentId?.name}`}>
          <p className="mb-3">{detail.exam.title} · Total marks: {detail.exam.totalMarks}</p>
          {detail.questions.map((question, index) => {
            const answer = detail.submission.answers.find((item) => String(item.questionId?._id || item.questionId) === String(question._id));
            const value = marks[question._id] || { marksAwarded: '', feedback: '' };
            return <div key={question._id} className="mb-4 rounded-xl border p-3"><b>{index + 1}. {question.questionText} ({question.marks} marks)</b>{question.answerScheme && <p className="mt-2 text-sm text-amber-200"><b>Teacher marking scheme:</b> {question.answerScheme}</p>}<p className="mt-2 text-sm">Student answer: {answer?.selectedAnswer || 'No answer provided'}</p><input min="0" max={question.marks} type="number" placeholder={`Marks awarded / ${question.marks}`} value={value.marksAwarded} onChange={(event) => setMarks({ ...marks, [question._id]: { ...value, marksAwarded: event.target.value } })} className="mt-2 w-full rounded p-2 text-slate-900" /></div>;
          })}
          <p>Teacher-entered total: {total} / {detail.exam.totalMarks}</p>
          <FormField label="Overall feedback"><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} className="w-full rounded p-2 text-slate-900" /></FormField>
          <div className="flex gap-2"><ReusableButton disabled={saving} onClick={() => save(false)}>{saving ? 'Saving…' : 'Save Evaluation'}</ReusableButton><ReusableButton disabled={saving} variant="success" onClick={() => save(true)}>{saving ? 'Saving…' : 'Finalize Evaluation'}</ReusableButton></div>
        </ReusableForm>
      </div>}
    </div>
  </div>;
}
