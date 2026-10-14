const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Readable } = require('stream');
const Exam = require('../models/exam');
const Submission = require('../models/submission');
const Question = require('../models/question');
const RecordingSession = require('../models/recordingSession');
const RecordingChunk = require('../models/recordingChunk');
const User = require('../models/user');
const storage = require('../lib/gridFsStorage');
const { requireAuth, allowRoles } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();
const student = [requireAuth, allowRoles('student')];
const teacher = [requireAuth, allowRoles('teacher')];
const POLICY_VERSION = 'exam-recording-v1';
// Playback URLs are bearer credentials, so never sign them with a hardcoded fallback.
const playbackSecret = () => process.env.JWT_SECRET || process.env.JWT_KEY || null;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const receiveChunk = (req, res, next) => upload.single('chunk')(req, res, (error) => {
  if (!error) return next();
  const tooLarge = error.code === 'LIMIT_FILE_SIZE';
  return res.status(tooLarge ? 413 : 400).json({ message: tooLarge ? 'Recording chunks must be 5 MB or smaller' : 'Invalid recording chunk upload' });
});
const validId = (id) => mongoose.isValidObjectId(id);
function normalizedMediaType(value) {
  return String(value || '').split(';', 1)[0].trim().toLowerCase();
}
function matchesMediaType(file, mediaType = normalizedMediaType(file.mimetype)) {
  if (mediaType === 'video/webm') return file.buffer.length >= 4 && file.buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mediaType === 'video/mp4') return file.buffer.length >= 8 && file.buffer.toString('ascii', 4, 8) === 'ftyp';
  if (mediaType === 'video/ogg') return file.buffer.length >= 4 && file.buffer.toString('ascii', 0, 4) === 'OggS';
  return false;
}
const examQuestions = (id) => Question.find({ examId: id }).select('-correctAnswer -explanation -answerScheme').sort({ order: 1, createdAt: 1 });

async function studentSession(id, userId) {
  if (!validId(id)) return null;
  return RecordingSession.findOne({ _id: id, studentId: userId });
}
async function authorizedTeacherAttempt(attemptId, teacherId) {
  if (!validId(attemptId)) return null;
  const submission = await Submission.findById(attemptId);
  if (!submission) return null;
  const exam = await Exam.findOne({ _id: submission.examId, createdBy: teacherId });
  if (!exam) return null;
  const session = await RecordingSession.findOne({ attemptId: submission._id, examId: exam._id, studentId: submission.studentId });
  return session ? { submission, exam, session } : null;
}
async function playbackAccess(req, res, next) {
  const token = req.query.playbackToken;
  if (!token) return requireAuth(req, res, () => allowRoles('teacher')(req, res, next));
  try {
    const secret = playbackSecret();
    if (!secret) return res.status(503).json({ message: 'Recording playback is unavailable because the server signing secret is not configured' });
    const claims = jwt.verify(String(token), secret);
    if (claims.purpose !== 'recording-playback' || String(claims.attemptId) !== String(req.params.attemptId)) return res.status(403).json({ message: 'Playback authorization is invalid' });
    const viewer = await User.findById(claims.sub).select('-password');
    if (!viewer || viewer.role !== 'teacher') return res.status(403).json({ message: 'Teacher access is required' });
    req.user = viewer;
    req.playbackClaims = claims;
    return next();
  } catch { return res.status(401).json({ message: 'Playback authorization has expired or is invalid' }); }
}

router.get('/policy', ...student, (req, res) => {
  const settings = storage.config();
  if (!settings) return res.json({ enabled: false, policyVersion: POLICY_VERSION, missingConfiguration: storage.missingConfiguration(), message: 'Private recording storage or an approved retention period is not configured.' });
  return res.json({ enabled: true, retentionDays: settings.retentionDays, policyVersion: POLICY_VERSION, authorizedViewer: 'The teacher who owns this exam.' });
});

router.post('/:sessionId/chunks', ...student, receiveChunk, async (req, res) => {
  try {
    const session = await studentSession(req.params.sessionId, req.user._id);
    if (!session) return res.status(404).json({ message: 'Recording session not found' });
    if (!req.file) return res.status(400).json({ message: 'A recording chunk is required' });
    if (req.file.size < 1) return res.status(400).json({ message: 'Recording chunks cannot be empty' });
    const mediaType = normalizedMediaType(req.file.mimetype);
    if (!['video/webm', 'video/mp4', 'video/ogg'].includes(mediaType)) return res.status(415).json({ message: 'Unsupported recording format; use a browser that records WebM or MP4 video' });
    const sequence = Number(req.body.sequence);
    if (!Number.isSafeInteger(sequence) || sequence < 0) return res.status(400).json({ message: 'Invalid chunk sequence' });
    if (sequence === 0 && !matchesMediaType(req.file, mediaType)) return res.status(415).json({ message: 'Unsupported or invalid recording format; use a browser that records WebM or MP4 video' });
    if (!['pending', 'recording', 'interrupted'].includes(session.status)) return res.status(409).json({ message: 'Recording session is not accepting chunks' });
    const crypto = require('crypto');
    const digest = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const duplicate = await RecordingChunk.findOne({ sessionId: session._id, sequence });
    if (duplicate) return duplicate.sha256 === digest ? res.json({ acknowledged: true, duplicate: true, sequence }) : res.status(409).json({ message: 'A different chunk already uses this sequence' });
    if (sequence !== session.nextSequence) return res.status(409).json({ message: 'Recording chunks must be uploaded in sequence' });
    const priorStatus = session.status;
    const lock = await RecordingSession.findOneAndUpdate({ _id: session._id, nextSequence: sequence, status: priorStatus }, { $set: { status: 'uploading' } }, { new: true });
    if (!lock) return res.status(409).json({ message: 'Another chunk upload is in progress; retry this chunk' });
    const key = `${session.storagePrefix}/${String(sequence).padStart(8, '0')}.part`;
    let gridFsFileId;
    try {
      gridFsFileId = await storage.put(key, req.file.buffer, req.file.mimetype, { sessionId: session._id, attemptId: session.attemptId, examId: session.examId, studentId: session.studentId, sequence });
      const sizeBytes = await storage.head(key, gridFsFileId);
      if (sizeBytes !== req.file.size) throw new Error('Stored chunk size did not match the uploaded chunk');
      await RecordingChunk.create({ sessionId: session._id, sequence, storageKey: key, gridFsFileId, sizeBytes, contentType: req.file.mimetype, sha256: digest });
      const readyStatus = priorStatus === 'pending' ? 'pending' : (priorStatus === 'interrupted' ? 'interrupted' : 'recording');
      await RecordingSession.updateOne({ _id: session._id, nextSequence: sequence, status: 'uploading' }, { $set: { status: readyStatus, nextSequence: sequence + 1, lastUploadAt: new Date() }, $inc: { chunkCount: 1, acknowledgedUploads: 1 } });
      return res.json({ acknowledged: true, sequence });
    } catch (error) {
      if (gridFsFileId) await storage.remove(key, gridFsFileId).catch(() => {});
      await RecordingSession.updateOne({ _id: session._id, nextSequence: sequence, status: 'uploading' }, { $set: { status: priorStatus, failureReason: 'chunk_upload_failed' } });
      return res.status(502).json({ message: 'Recording chunk was not stored. Retry the same chunk.' });
    }
  } catch (error) { return res.status(500).json({ message: 'Unable to process recording chunk' }); }
});

router.post('/:sessionId/ready', ...student, async (req, res) => {
  try {
    const session = await studentSession(req.params.sessionId, req.user._id);
    if (!session) return res.status(404).json({ message: 'Recording session not found' });
    if (!session.chunkCount || session.acknowledgedUploads < 1) return res.status(409).json({ message: 'The first recording chunk has not been acknowledged by storage' });
    const firstChunk = await RecordingChunk.findOne({ sessionId: session._id, sequence: 0 });
    if (!firstChunk || await storage.head(firstChunk.storageKey, firstChunk.gridFsFileId) !== firstChunk.sizeBytes) return res.status(503).json({ message: 'Initial recording upload could not be verified' });
    const submission = await Submission.findOne({ _id: session.attemptId, studentId: req.user._id, examId: session.examId });
    const exam = await Exam.findOne({ _id: session.examId, status: 'published' });
    if (!submission || !exam) return res.status(404).json({ message: 'Attempt or exam not found' });
    const now = new Date();
    if (submission.status === 'pending') {
      if (now < exam.startDate || now > exam.endDate) return res.status(410).json({ message: 'Exam is outside its scheduled window' });
      const activated = await Submission.findOneAndUpdate({ _id: submission._id, status: 'pending' }, { $set: { status: 'active', timerStartedAt: now, startedAt: now, expiresAt: new Date(Math.min(now.getTime() + exam.duration * 60000, exam.endDate.getTime())) } }, { new: true });
      if (activated) submission.set(activated.toObject());
      else { const current = await Submission.findById(submission._id); if (current) submission.set(current.toObject()); }
    }
    if (submission.status !== 'active') return res.status(409).json({ message: 'Exam attempt is not ready to begin' });
    await RecordingSession.updateOne({ _id: session._id, status: { $in: ['pending', 'recording', 'interrupted'] } }, { $set: { status: 'recording', startedAt: session.startedAt || now, failureReason: '' } });
    const answers = Object.fromEntries((submission.answers || []).map((answer) => [String(answer.questionId), answer.selectedAnswer]));
    return res.json({ ready: true, submission, questions: await examQuestions(exam._id), answers });
  } catch (error) { return res.status(503).json({ message: 'Recording readiness could not be verified' }); }
});

router.post('/:sessionId/interrupt', ...student, async (req, res) => {
  const session = await studentSession(req.params.sessionId, req.user._id);
  if (!session) return res.status(404).json({ message: 'Recording session not found' });
  if (['complete', 'incomplete', 'failed'].includes(session.status)) return res.json({ status: session.status });
  const reason = ['device_lost', 'upload_failed', 'page_closed', 'recorder_error'].includes(req.body?.reason) ? req.body.reason : 'interrupted';
  await RecordingSession.updateOne({ _id: session._id, status: { $nin: ['complete', 'incomplete', 'failed'] } }, { $set: { status: 'interrupted', failureReason: reason } });
  return res.json({ status: 'interrupted' });
});

router.post('/:sessionId/finalize', ...student, async (req, res) => {
  try {
    const session = await studentSession(req.params.sessionId, req.user._id);
    if (!session) return res.status(404).json({ message: 'Recording session not found' });
    const submission = await Submission.findOne({ _id: session.attemptId, examId: session.examId, studentId: req.user._id, status: 'submitted' });
    if (!submission) return res.status(409).json({ message: 'Submit the exam successfully before finalizing its recording' });
    if (session.status === 'complete') return res.json({ status: 'complete', chunkCount: session.chunkCount });
    const finalSequence = Number(req.body?.finalSequence);
    if (!Number.isSafeInteger(finalSequence) || finalSequence < 0 || finalSequence !== session.nextSequence - 1) {
      await RecordingSession.updateOne({ _id: session._id, status: { $nin: ['complete', 'incomplete'] } }, { $set: { status: 'incomplete', endedAt: new Date(), failureReason: 'final_sequence_invalid' } });
      return res.status(409).json({ status: 'incomplete', message: 'Final recording sequence is invalid or incomplete' });
    }
    await RecordingSession.updateOne({ _id: session._id, status: { $nin: ['complete', 'incomplete'] } }, { $set: { status: 'finalizing', finalSequence } });
    const chunks = await RecordingChunk.find({ sessionId: session._id }).sort({ sequence: 1 });
    if (chunks.length !== finalSequence + 1 || chunks.some((chunk, index) => chunk.sequence !== index)) {
      await RecordingSession.updateOne({ _id: session._id }, { $set: { status: 'incomplete', endedAt: new Date(), failureReason: 'missing_chunk' } });
      return res.status(409).json({ status: 'incomplete', message: 'One or more recording chunks are missing' });
    }
    for (const chunk of chunks) if (await storage.head(chunk.storageKey, chunk.gridFsFileId) !== chunk.sizeBytes) {
      await RecordingSession.updateOne({ _id: session._id }, { $set: { status: 'incomplete', endedAt: new Date(), failureReason: 'stored_chunk_unavailable' } });
      return res.status(409).json({ status: 'incomplete', message: 'A stored recording chunk could not be verified' });
    }
    const endedAt = new Date();
    await RecordingSession.updateOne({ _id: session._id }, { $set: { status: 'complete', endedAt, durationSeconds: session.startedAt ? Math.max(0, Math.floor((endedAt - session.startedAt) / 1000)) : 0, acknowledgedUploads: chunks.length, failureReason: '' } });
    return res.json({ status: 'complete', chunkCount: chunks.length });
  } catch (error) {
    await RecordingSession.updateOne({ _id: req.params.sessionId }, { $set: { status: 'incomplete', endedAt: new Date(), failureReason: 'finalization_failed' } }).catch(() => {});
    return res.status(503).json({ status: 'incomplete', message: 'Recording could not be fully verified' });
  }
});

router.get('/teacher/attempt/:attemptId', ...teacher, async (req, res) => {
  const result = await authorizedTeacherAttempt(req.params.attemptId, req.user._id);
  if (!result) return res.status(404).json({ message: 'Recording not found' });
  const { session, submission, exam } = result;
  const studentRecord = await User.findById(submission.studentId).select('name rollNumber');
  return res.json({
    recording: { id: session._id, attemptId: submission._id, status: session.status, startedAt: session.startedAt, endedAt: session.endedAt, durationSeconds: session.durationSeconds, chunkCount: session.chunkCount, lastUploadAt: session.lastUploadAt, failureReason: session.failureReason },
    student: { name: studentRecord?.name || 'Unavailable', rollNumber: studentRecord?.rollNumber || '', id: submission.studentId },
    exam: { title: exam.title, subject: exam.subject },
  });
});

router.post('/teacher/attempt/:attemptId/playback', ...teacher, async (req, res) => {
  const result = await authorizedTeacherAttempt(req.params.attemptId, req.user._id);
  if (!result) return res.status(404).json({ message: 'Recording not found' });
  if (result.session.status !== 'complete') return res.status(409).json({ message: 'Recording is not complete and cannot be played' });
  const secret = playbackSecret();
  if (!secret) return res.status(503).json({ message: 'Recording playback is unavailable because the server signing secret is not configured' });
  const playbackToken = jwt.sign({ purpose: 'recording-playback', attemptId: String(result.submission._id), sessionId: String(result.session._id) }, secret, { subject: String(req.user._id), expiresIn: '15m' });
  return res.json({ playbackUrl: `/api/recordings/teacher/attempt/${result.submission._id}/stream?playbackToken=${encodeURIComponent(playbackToken)}`, expiresInSeconds: 900 });
});

router.get('/teacher/attempt/:attemptId/stream', playbackAccess, async (req, res) => {
  try {
    const result = await authorizedTeacherAttempt(req.params.attemptId, req.user._id);
    if (!result) return res.status(404).json({ message: 'Recording not found' });
    if (req.playbackClaims && String(req.playbackClaims.sessionId) !== String(result.session._id)) return res.status(403).json({ message: 'Playback authorization is invalid' });
    if (result.session.status !== 'complete') return res.status(409).json({ message: 'Recording is not complete and cannot be played' });
    console.info('Authorized exam recording playback', { teacherId: String(req.user._id), examId: String(result.exam._id), attemptId: String(result.submission._id) });
    const chunks = await RecordingChunk.find({ sessionId: result.session._id }).sort({ sequence: 1 });
    if (!chunks.length || chunks.length !== result.session.chunkCount) return res.status(409).json({ message: 'Recording chunks are incomplete' });
    const totalBytes = chunks.reduce((total, chunk) => total + chunk.sizeBytes, 0);
    let rangeStart = 0;
    let rangeEnd = totalBytes - 1;
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) { res.setHeader('Content-Range', `bytes */${totalBytes}`); return res.status(416).end(); }
      if (!match[1]) rangeStart = Math.max(0, totalBytes - Number(match[2]));
      else rangeStart = Number(match[1]);
      if (match[1] && match[2]) rangeEnd = Number(match[2]);
      if (rangeStart >= totalBytes || rangeEnd < rangeStart) { res.setHeader('Content-Range', `bytes */${totalBytes}`); return res.status(416).end(); }
      rangeEnd = Math.min(rangeEnd, totalBytes - 1);
    }
    res.setHeader('Content-Type', chunks[0].contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', rangeEnd - rangeStart + 1);
    if (range) { res.status(206); res.setHeader('Content-Range', `bytes ${rangeStart}-${rangeEnd}/${totalBytes}`); }
    const stream = Readable.from((async function* () {
      let fileOffset = 0;
      for (const chunk of chunks) {
        const fileEnd = fileOffset + chunk.sizeBytes - 1;
        if (fileEnd < rangeStart) { fileOffset += chunk.sizeBytes; continue; }
        if (fileOffset > rangeEnd) break;
        const storedChunk = await storage.get(chunk.storageKey, chunk.gridFsFileId);
        let partOffset = 0;
        for await (const part of storedChunk) {
          const partStart = fileOffset + partOffset;
          const partEnd = partStart + part.length - 1;
          partOffset += part.length;
          if (partEnd < rangeStart) continue;
          if (partStart > rangeEnd) break;
          yield part.subarray(Math.max(0, rangeStart - partStart), Math.min(part.length, rangeEnd - partStart + 1));
        }
        fileOffset += chunk.sizeBytes;
      }
    })());
    stream.on('error', () => {
      if (!res.destroyed) RecordingSession.updateOne({ _id: result.session._id, status: 'complete' }, { $set: { status: 'incomplete', endedAt: new Date(), failureReason: 'playback_data_unavailable' } }).catch(() => {});
      if (!res.headersSent) res.status(502);
      res.end();
    });
    stream.pipe(res);
  } catch (error) { if (!res.headersSent) return res.status(502).json({ message: 'Unable to retrieve recording' }); res.end(); }
});

async function purgeExpiredRecordings() {
  if (!storage.isConnected()) return;
  const expiredSessions = await RecordingSession.find({ retentionExpiresAt: { $lte: new Date() } }).select('_id');
  for (const session of expiredSessions) {
    const chunks = await RecordingChunk.find({ sessionId: session._id }).select('storageKey gridFsFileId');
    for (const chunk of chunks) await storage.remove(chunk.storageKey, chunk.gridFsFileId);
    await RecordingChunk.deleteMany({ sessionId: session._id });
    await RecordingSession.deleteOne({ _id: session._id });
  }
}

module.exports = { router, purgeExpiredRecordings, normalizedMediaType, matchesMediaType };
