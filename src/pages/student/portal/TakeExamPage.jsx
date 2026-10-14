import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog, PageHeader, ReusableButton, ReusableCard, EmptyState } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';
import { examAvailability, formatExamDateTime } from '../../../lib/dateTime';

const POLICY_VERSION = 'exam-recording-v1';
const CAMERA_CONSTRAINTS = { width: { ideal: 640, max: 1280 }, height: { ideal: 360, max: 720 }, frameRate: { ideal: 15, max: 24 } };
const TAB_WARNING = 'Warning: You left the exam screen. Please remain on the exam page until you submit your exam.';
const CLIPBOARD_WARNING = 'Copy and paste are not allowed during the exam. Please answer the questions using your own work.';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function TakeExamPage() {
  const [params] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('not_started');
  const [recordingError, setRecordingError] = useState('');
  const [warning, setWarning] = useState('');
  const [setupBusy, setSetupBusy] = useState(false);
  const [deviceTestBusy, setDeviceTestBusy] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitConfirmationOpen, setSubmitConfirmationOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const sequenceRef = useRef(0);
  const uploadQueueRef = useRef(Promise.resolve());
  const recordingSessionRef = useRef(null);
  const attemptActiveRef = useRef(false);
  const completedRef = useRef(false);
  const leftPageRef = useRef(false);
  const startupCancelledRef = useRef(false);
  const stoppingRecorderRef = useRef(false);
  const answerSaveTimerRef = useRef(null);
  const answerSavePromiseRef = useRef(Promise.resolve());

  const load = useCallback(() => api('/exams/available').then((data) => setExams(data.exams)).catch(() => setMessage('Unable to load exams. Please try again.')), []);
  useEffect(() => { load(); api('/recordings/policy').then(setPolicy).catch(() => setPolicy({ enabled: false, message: 'Unable to verify recording policy or storage.' })); }, [load]);
  useEffect(() => { const id = params.get('examId'); if (id && exams.some((exam) => exam._id === id)) { setSelectedExamId(id); setNoticeOpen(true); } }, [exams, params]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [noticeOpen, setupBusy, deviceTestBusy]);

  useEffect(() => {
    const onVisibility = () => {
      if (!attemptActiveRef.current) return;
      if (document.visibilityState === 'hidden') leftPageRef.current = true;
      else if (leftPageRef.current) { leftPageRef.current = false; setWarning(TAB_WARNING); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => () => {
    if (answerSaveTimerRef.current) clearTimeout(answerSaveTimerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch {} }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (attemptActiveRef.current && !completedRef.current && recordingSessionRef.current) {
      const token = localStorage.getItem('examnova-token');
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/recordings/${recordingSessionRef.current.id}/interrupt`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ reason: 'page_closed' }) }).catch(() => {});
    }
  }, []);

  const selectedExam = exams.find((exam) => exam._id === selectedExamId);
  const releaseDevices = () => {
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const testDevices = async () => {
    if (deviceTestBusy || setupBusy) return;
    releaseDevices(); setDeviceTestBusy(true); setDeviceStatus('Requesting camera permission…');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setDeviceStatus('Camera access requires HTTPS (localhost is allowed) and a browser that supports media devices.');
      setDeviceTestBusy(false); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: CAMERA_CONSTRAINTS, audio: false });
      const cameraReady = stream.getVideoTracks().some((track) => track.readyState === 'live');
      if (!cameraReady) throw new Error('A live camera is required. Check the camera connection and browser permission.');
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setDeviceStatus('Camera is available. This is a local device check; it does not start an exam or upload a recording.');
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      const denied = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';
      setDeviceStatus(denied ? 'Camera permission was denied. Allow camera access in your browser site settings, then test again.' : (error.message || 'Unable to access the camera. Check that it is connected and not in use by another application.'));
    } finally { setDeviceTestBusy(false); }
  };

  const uploadWithRetry = async (blob, sequence, sessionId, mimeType) => {
    let lastError;
    for (let tries = 0; tries < 3; tries += 1) {
      try {
        const form = new FormData();
        form.append('sequence', String(sequence));
        form.append('chunk', new File([blob], `chunk-${sequence}.webm`, { type: mimeType }));
        return await api(`/recordings/${sessionId}/chunks`, { method: 'POST', body: form });
      } catch (error) { lastError = error; if (tries < 2) await sleep(400 * (2 ** tries)); }
    }
    throw lastError;
  };

  const beginExam = async () => {
    if (!selectedExam || !consent || setupBusy) return;
    if (!policy?.enabled) {
      setRecordingError(`Recording storage and an approved retention period must be configured before this exam can start.${policy?.missingConfiguration?.length ? ` Missing backend settings: ${policy.missingConfiguration.join(', ')}.` : ''}`);
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecordingError('Recording requires a supported browser and a secure HTTPS connection. On this computer, localhost is also allowed. Update your browser or open the secure ExamNova site.');
      return;
    }
    const supportedType = ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find((type) => MediaRecorder.isTypeSupported(type));
    if (!supportedType) { setRecordingError('This browser cannot record webcam video in a supported format. Use an up-to-date Chrome, Edge, or Firefox browser.'); return; }
      setSetupBusy(true); setRecordingError('Requesting camera permission…'); setRecordingStatus('pending'); setMessage('');
    let stream;
    try {
      releaseDevices();
      stream = await navigator.mediaDevices.getUserMedia({ video: CAMERA_CONSTRAINTS, audio: false });
      startupCancelledRef.current = false;
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (!stream.getVideoTracks().some((track) => track.readyState === 'live')) throw new Error('A live camera is required. Check that it is connected and enabled.');
      const prepared = await api(`/submissions/${selectedExam._id}/start`, { method: 'POST', body: JSON.stringify({ consent: true, policyVersion: POLICY_VERSION }) });
      attemptActiveRef.current = false;
      const recordingSession = prepared.recordingSession;
      recordingSessionRef.current = recordingSession; setSession(recordingSession);
      sequenceRef.current = recordingSession.nextSequence || 0;
      uploadQueueRef.current = Promise.resolve();
      const recorder = new MediaRecorder(stream, { mimeType: supportedType, videoBitsPerSecond: 1200000 });
      recorderRef.current = recorder;
      setRecordingError('Camera is ready. Waiting for the first private upload acknowledgement…');
      setRecordingStatus('uploading');
      const firstSequence = sequenceRef.current;
      let firstResolve; let firstReject;
      const firstUpload = new Promise((resolve, reject) => { firstResolve = resolve; firstReject = reject; });
      const firstTimeout = setTimeout(() => firstReject(new Error('The initial recording upload timed out. Check your connection and retry.')), 25000);
      recorder.addEventListener('dataavailable', (event) => {
        if (!event.data?.size) return;
        const sequence = sequenceRef.current++;
        const mime = (recorder.mimeType || event.data.type || supportedType).split(';')[0].trim();
        uploadQueueRef.current = uploadQueueRef.current.then(async () => {
          try {
            await uploadWithRetry(event.data, sequence, recordingSession.id, mime);
            if (startupCancelledRef.current) return;
            setRecordingStatus('recording');
            if (sequence === firstSequence) {
              const ready = await api(`/recordings/${recordingSession.id}/ready`, { method: 'POST' });
              setAttempt(ready.submission); setQuestions(ready.questions); setAnswers(ready.answers || {});
              setRecordingStatus('recording'); setRecordingError(''); setNoticeOpen(false); attemptActiveRef.current = true;
              clearTimeout(firstTimeout); firstResolve(true);
            }
          } catch (error) {
            setRecordingStatus('interrupted'); setRecordingError(`Recording upload failed: ${error.message}. The exam will not start until the first chunk is safely uploaded.`);
            api(`/recordings/${recordingSession.id}/interrupt`, { method: 'POST', body: JSON.stringify({ reason: 'upload_failed' }) }).catch(() => {});
            if (sequence === firstSequence) { clearTimeout(firstTimeout); firstReject(error); }
          }
        });
      });
      recorder.addEventListener('error', () => {
        setRecordingStatus('failed'); setRecordingError('The browser recorder stopped unexpectedly. Check camera permission and availability.');
        if (attemptActiveRef.current) api(`/recordings/${recordingSession.id}/interrupt`, { method: 'POST', body: JSON.stringify({ reason: 'recorder_error' }) }).catch(() => {});
        clearTimeout(firstTimeout); firstReject(new Error('Browser recording initialization failed.'));
      });
      stream.getTracks().forEach((track) => track.addEventListener('ended', () => {
        if (stoppingRecorderRef.current || completedRef.current || startupCancelledRef.current) return;
        if (!attemptActiveRef.current) {
          startupCancelledRef.current = true;
          clearTimeout(firstTimeout);
          firstReject(new Error('The camera stopped before recording became ready. Reconnect it and try the setup again.'));
          return;
        }
        setRecordingStatus('interrupted'); setRecordingError('The camera track ended. Your exam can continue, but recording may be incomplete. Reconnect the camera if possible; this event does not affect marks or submission.');
        api(`/recordings/${recordingSession.id}/interrupt`, { method: 'POST', body: JSON.stringify({ reason: 'device_lost' }) }).catch(() => {});
      }));
      recorder.start(3000);
      await firstUpload;
      setRecordingError('');
    } catch (error) {
      startupCancelledRef.current = true;
      setRecordingStatus('failed');
      const denied = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';
      setRecordingError(denied ? 'Camera permission was denied. Allow camera access in your browser site settings, then try again.' : (error.message || 'Unable to initialize recording. Check that your camera is connected and not in use by another app.'));
      if (recordingSessionRef.current) api(`/recordings/${recordingSessionRef.current.id}/interrupt`, { method: 'POST', body: JSON.stringify({ reason: 'recorder_error' }) }).catch(() => {});
      if (recorderRef.current && recorderRef.current.state !== 'inactive') { try { recorderRef.current.stop(); } catch {} }
      releaseDevices();
    } finally { setSetupBusy(false); }
  };

  const persistAnswerSet = (next) => {
    if (!attempt) return Promise.resolve();
    const request = api(`/submissions/${attempt.examId}/answers`, { method: 'PUT', body: JSON.stringify({ answers: Object.entries(next).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })) }) });
    answerSavePromiseRef.current = request.catch((error) => { setMessage(`Answer save failed: ${error.message}. Keep this page open and retry before submitting.`); });
    return answerSavePromiseRef.current;
  };
  const save = (next) => {
    setAnswers(next);
    if (answerSaveTimerRef.current) clearTimeout(answerSaveTimerRef.current);
    return persistAnswerSet(next);
  };
  const queueAnswerSave = (next) => {
    setAnswers(next);
    if (answerSaveTimerRef.current) clearTimeout(answerSaveTimerRef.current);
    answerSaveTimerRef.current = setTimeout(() => {
      if (!attempt) return;
      persistAnswerSet(next);
    }, 600);
  };

  const warnClipboard = (event) => { event.preventDefault(); setWarning(CLIPBOARD_WARNING); };
  const stopRecorder = async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    stoppingRecorderRef.current = true;
    await new Promise((resolve) => {
      recorder.addEventListener('stop', resolve, { once: true });
      try { recorder.stop(); } catch { resolve(); }
      setTimeout(resolve, 5000);
    });
    await uploadQueueRef.current;
  };

  const submit = async () => {
    if (busy || !attempt) return;
    setSubmitConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    if (busy || !attempt) return;
    setSubmitConfirmationOpen(false);
    if (answerSaveTimerRef.current) clearTimeout(answerSaveTimerRef.current);
    setBusy(true); setMessage('Saving your exam answers…');
    let submissionSaved = false;
    try {
      await answerSavePromiseRef.current;
      try { await stopRecorder(); } catch { setRecordingStatus('incomplete'); }
      const result = await api(`/submissions/${attempt.examId}/submit`, { method: 'POST', body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })) }) });
      submissionSaved = true; completedRef.current = true; attemptActiveRef.current = false;
      releaseDevices(); setAttempt(null); await load();
      setMessage(result.alreadySubmitted ? 'This exam submission is already recorded.' : 'Your exam answers have been submitted and are awaiting teacher evaluation.');
      if (session?.id) {
        try {
          const finalSequence = sequenceRef.current - 1;
          const finalized = await api(`/recordings/${session.id}/finalize`, { method: 'POST', body: JSON.stringify({ finalSequence }) });
          setRecordingStatus(finalized.status);
          if (finalized.status !== 'complete') setMessage('Your exam was submitted. The recording is marked incomplete and will be available to your teacher as such.');
        } catch { setRecordingStatus('incomplete'); setMessage('Your exam answers were submitted successfully, but recording finalization failed. The recording is marked incomplete; no retake is required or allowed.'); }
      }
    } catch (error) {
      setMessage(`Submission was not confirmed: ${error.message}. Retry submission; your existing attempt and saved answers are retained.`);
      if (!submissionSaved && session?.id) api(`/recordings/${session.id}/interrupt`, { method: 'POST', body: JSON.stringify({ reason: 'page_closed' }) }).catch(() => {});
      releaseDevices(); setRecordingStatus('interrupted');
    } finally { setBusy(false); }
  };

  const openExam = (exam) => { setSelectedExamId(exam._id); setConsent(false); setRecordingError(''); setNoticeOpen(true); };
  const seconds = attempt ? Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - now) / 1000)) : 0;
  if (!attempt) return <div className="space-y-6"><PageHeader title="Take Exam" subtitle="Camera recording must be ready before exam questions are shown" />{message && <p role="status" className="text-cyan-300">{message}</p>}
    {noticeOpen && selectedExam && <ReusableCard title="Recording notice and exam readiness" subtitle={selectedExam.title}>
      <div className="space-y-3 text-slate-200"><p>ExamNova.ai will record webcam video during this exam for review of the exam session and to support assessment integrity. Audio is not recorded.</p><p>Authorized viewer: the teacher who owns this exam. Recordings are review evidence only; browser events and recordings do not automatically determine misconduct or affect marks.</p><p>Retention: {policy?.enabled ? `${policy.retentionDays} days from recording setup, followed by scheduled deletion.` : 'Not available until the institution configures an approved retention period.'}</p><p>A working camera, browser permission, a supported recording format, and a working network connection are required. Device, browser, or network interruptions may make the recording incomplete.</p>
        {!policy?.enabled && <p role="alert" className="text-amber-300">Recording is not configured, so the exam cannot start. {policy?.message || ''} {policy?.missingConfiguration?.length ? `Set these backend environment values: ${policy.missingConfiguration.join(', ')}.` : ''}</p>}
        <label className="flex items-start gap-2"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I have read the recording notice and acknowledge webcam video recording for this exam.</span></label>
        {(setupBusy || deviceTestBusy || streamRef.current) && <video ref={videoRef} autoPlay muted playsInline className="max-h-64 rounded-lg bg-black" aria-label="Live camera preview" />}
        {deviceStatus && !setupBusy && <p role="status" className="text-slate-300">{deviceStatus}</p>}
        {recordingError && !setupBusy && <p role="alert" className="text-amber-300">{recordingError}</p>}
        <div className="flex flex-wrap gap-3"><ReusableButton variant="secondary" disabled={deviceTestBusy || setupBusy} onClick={testDevices}>Test camera</ReusableButton><ReusableButton disabled={!consent || setupBusy || deviceTestBusy} onClick={beginExam}>{setupBusy ? 'Checking camera and recording…' : 'Acknowledge and prepare exam'}</ReusableButton><ReusableButton variant="secondary" disabled={setupBusy || deviceTestBusy} onClick={() => { releaseDevices(); setNoticeOpen(false); setConsent(false); setDeviceStatus(''); }}>Cancel</ReusableButton></div>
      </div>
    </ReusableCard>}
    <ReusableCard title="Your Exams">{exams.length ? exams.map((exam) => { const state = examAvailability(exam, now); const completed = exam.attemptStatus === 'submitted'; const active = exam.attemptStatus === 'active'; return <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-slate-200" key={exam._id}><span><b>{exam.title}</b><br /><small>{exam.subject} · {formatExamDateTime(exam.startDate)} IST · {completed ? 'Submitted' : active ? 'In progress' : state}</small></span><ReusableButton disabled={completed || state !== 'Live' || setupBusy} onClick={() => openExam(exam)}>{completed ? 'Submitted' : active || exam.attemptStatus === 'pending' ? 'Resume setup' : state === 'Live' ? 'Take Exam' : state}</ReusableButton></div>; }) : <EmptyState title="No published exams available." message="Published exams for your department will appear here." />}</ReusableCard></div>;

  return <div className="space-y-6" onCopy={warnClipboard} onCut={warnClipboard} onPaste={warnClipboard} onContextMenu={warnClipboard} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && ['c', 'x', 'v'].includes(event.key.toLowerCase())) warnClipboard(event); }}>
    <ConfirmDialog open={submitConfirmationOpen} title="Submit exam?" message="Submit this exam now? You cannot start another attempt after submission." onConfirm={confirmSubmit} onCancel={() => setSubmitConfirmationOpen(false)} />
    <PageHeader title="Take Exam" subtitle="Your answers are saved to your single attempt" action={<span className="text-cyan-300">Time left: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>} />
    <p aria-live="polite" className="text-sm text-cyan-300">Recording status: {recordingStatus}. Uploaded chunks are acknowledged by the private recording service.</p>
    {recordingError && <p role="status" className="text-amber-300">{recordingError}</p>}{message && <p role="status" className="text-cyan-300">{message}</p>}
    {warning && <div role="alert" aria-live="assertive" className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/50 bg-amber-950/80 p-4 text-amber-100"><span>{warning}</span><button type="button" aria-label="Dismiss warning" onClick={() => setWarning('')}>Dismiss</button></div>}
    <video ref={videoRef} autoPlay muted playsInline className="max-h-48 rounded-lg bg-black" aria-label="Camera recording preview" />
    <ReusableCard title="Questions">{questions.map((question, index) => <div key={question._id} className="mb-5 rounded-xl border p-4 text-slate-200"><p>{question.section && <span className="mr-1 font-semibold text-cyan-200">{question.section} ·</span>}<b>{index + 1}. {question.questionText}</b> ({question.marks} marks)</p>{question.questionType === 'mcq' ? question.options.map((option) => <label key={option} className="mt-2 block"><input type="radio" checked={answers[question._id] === option} onChange={() => save({ ...answers, [question._id]: option })} /> {option}</label>) : question.questionType === 'very-short-answer' ? <input type="text" value={answers[question._id] || ''} onChange={(event) => queueAnswerSave({ ...answers, [question._id]: event.target.value })} onBlur={(event) => save({ ...answers, [question._id]: event.target.value })} className="mt-2 w-full rounded p-2 text-slate-900" placeholder="Type your answer" /> : <textarea value={answers[question._id] || ''} onChange={(event) => queueAnswerSave({ ...answers, [question._id]: event.target.value })} onBlur={(event) => save({ ...answers, [question._id]: event.target.value })} className="mt-2 w-full rounded p-2 text-slate-900" placeholder={question.questionType === 'short-answer' ? 'Write a short answer' : 'Write your answer'} />} </div>)}<ReusableButton variant="success" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit Exam'}</ReusableButton></ReusableCard>
  </div>;
}
