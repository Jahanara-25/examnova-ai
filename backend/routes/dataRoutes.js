const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Exam = require('../models/exam');
const Result = require('../models/result');
const Submission = require('../models/submission');
const Certificate = require('../models/certificate');
const Notification = require('../models/notification');
const User = require('../models/user');
const { requireAuth, allowRoles } = require('../middleware/auth');
const { notifyOnce } = require('../lib/notifications');

const router = express.Router();
router.use(requireAuth);
const passPercentage = () => {
  const configured = Number(process.env.PASS_PERCENTAGE);
  return Number.isFinite(configured) && configured >= 0 && configured <= 100 ? configured : 40;
};
const ownedExamIds = async (teacherId) => (await Exam.find({ createdBy: teacherId }).select('_id')).map((exam) => exam._id);
const legacyOrPublished = { $or: [{ status: 'published' }, { status: { $exists: false } }] };

router.get('/results', allowRoles('student'), async (req, res) => {
  const results = await Result.find({ studentId: req.user._id, status: 'published' }).populate('examId', 'title subject').sort({ evaluatedAt: -1 });
  return res.json({ results });
});

router.get('/certificates', allowRoles('student'), async (req, res) => {
  try {
    const certificates = await Certificate.find({ studentId: req.user._id, ...legacyOrPublished })
      .populate('examId', 'title subject').populate({ path: 'resultId', match: { status: 'published' }, select: 'obtainedMarks totalMarks percentage status' }).sort({ issuedAt: -1, createdAt: -1 });
    return res.json({ certificates: certificates.filter((certificate) => certificate.resultId), passPercentage: passPercentage() });
  } catch {
    return res.status(500).json({ message: 'Unable to load certificates' });
  }
});

router.get('/analytics/student', allowRoles('student'), async (req, res) => {
  const results = await Result.find({ studentId: req.user._id, status: 'published' }).populate('examId', 'subject');
  const scores = results.map((result) => result.percentage);
  const subjects = {};
  results.forEach((result) => { const name = result.examId?.subject || 'Other'; (subjects[name] ??= []).push(result.percentage); });
  return res.json({ totalExams: results.length, average: scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0, highest: scores.length ? Math.max(...scores) : 0, lowest: scores.length ? Math.min(...scores) : 0, trend: results.map((result) => ({ name: result.examId?.subject || 'Exam', score: result.percentage })), subjects: Object.entries(subjects).map(([name, values]) => ({ name, value: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) })) });
});

router.get('/analytics/teacher', allowRoles('teacher'), async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id });
  const ids = exams.map((exam) => exam._id);
  const submissions = await Submission.find({ examId: { $in: ids }, status: 'submitted' });
  const results = await Result.find({ examId: { $in: ids }, status: 'published' }).populate('examId', 'title subject').sort({ evaluatedAt: 1 });
  const average = results.length ? results.reduce((sum, result) => sum + result.percentage, 0) / results.length : 0;
  const pending = submissions.filter((submission) => !results.some((result) => String(result.submissionId) === String(submission._id))).length;
  const subjectScores = {};
  results.forEach((result) => {
    const name = result.examId?.subject || 'Other';
    (subjectScores[name] ??= []).push(result.percentage);
  });
  return res.json({ activeExams: exams.filter((exam) => exam.status === 'published').length, totalExams: exams.length, totalSubmissions: submissions.length, pendingEvaluations: pending, averageScore: Number(average.toFixed(1)), passRate: results.length ? Number((results.filter((result) => result.percentage >= passPercentage()).length / results.length * 100).toFixed(1)) : 0, trend: results.map((result) => ({ name: result.examId?.title || 'Exam', score: result.percentage })), subjects: Object.entries(subjectScores).map(([name, values]) => ({ name, value: Number((values.reduce((sum, score) => sum + score, 0) / values.length).toFixed(1)) })) });
});

router.get('/students', allowRoles('teacher'), async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id }).select('_id department eligibility');
  const departments = new Set([req.user.department, ...exams.flatMap((exam) => [exam.department, ...(exam.eligibility || [])])].filter(Boolean).map((value) => String(value).trim().toLocaleLowerCase('en-IN')));
  if (!departments.size) return res.json({ students: [] });
  const students = await User.find({ role: 'student' }).select('name rollNumber department createdAt').sort({ name: 1 });
  const accessible = students.filter((student) => departments.has(String(student.department || '').trim().toLocaleLowerCase('en-IN')));
  const results = await Result.find({ examId: { $in: exams.map((exam) => exam._id) }, status: 'published', studentId: { $in: accessible.map((student) => student._id) } }).select('studentId percentage');
  const byStudent = new Map();
  results.forEach((result) => { const id = String(result.studentId); const values = byStudent.get(id) || []; values.push(result.percentage); byStudent.set(id, values); });
  return res.json({ students: accessible.map((student) => {
    const scores = byStudent.get(String(student._id)) || [];
    return { _id: student._id, name: student.name, rollNumber: student.rollNumber || '', department: student.department || '', createdAt: student.createdAt, examsAttempted: scores.length, average: scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : null };
  }) });
});

router.get('/reports/teacher', allowRoles('teacher'), async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id }).select('_id title subject department');
  const results = await Result.find({ examId: { $in: exams.map((exam) => exam._id) }, status: 'published' }).populate('studentId', 'name department').populate('examId', 'subject');
  const students = new Map(); const subjects = new Map();
  results.forEach((result) => {
    const student = result.studentId;
    if (student) { const current = students.get(String(student._id)) || { id: String(student._id), name: student.name, batch: student.department, examsAttempted: 0, total: 0 }; current.examsAttempted += 1; current.total += result.percentage; students.set(String(student._id), current); }
    const subjectName = result.examId?.subject || 'Other'; const current = subjects.get(subjectName) || { subject: subjectName, count: 0, total: 0 }; current.count += 1; current.total += result.percentage; subjects.set(subjectName, current);
  });
  return res.json({ students: [...students.values()].map((student) => ({ ...student, percentage: Number((student.total / student.examsAttempted).toFixed(1)), status: student.total / student.examsAttempted >= passPercentage() ? 'Pass' : 'Needs support' })), subjects: [...subjects.values()].map((subject) => ({ subject: subject.subject, attempts: subject.count, average: Number((subject.total / subject.count).toFixed(1)) })) });
});

router.get('/certificates/eligible', allowRoles('teacher'), async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id }).select('_id title subject totalMarks');
  const results = await Result.find({ examId: { $in: exams.map((exam) => exam._id) }, status: 'published', percentage: { $gte: passPercentage() } }).populate('studentId', 'name rollNumber department').populate('examId', 'title subject totalMarks');
  const certificates = await Certificate.find({ resultId: { $in: results.map((result) => result._id) } }).select('resultId certificateId status issuedAt');
  const certificateMap = new Map(certificates.map((certificate) => [String(certificate.resultId), certificate]));
  return res.json({ passPercentage: passPercentage(), certificates: results.filter((result) => result.studentId && result.examId).map((result) => {
    const certificate = certificateMap.get(String(result._id));
    return { id: String(result._id), studentId: String(result.studentId._id), student: result.studentId.name, rollNumber: result.studentId.rollNumber || '', department: result.studentId.department || '', examId: String(result.examId._id), exam: result.examId.title, subject: result.examId.subject, marks: result.obtainedMarks, totalMarks: result.totalMarks, percentage: result.percentage, evaluatedAt: result.evaluatedAt, certificateId: certificate?.certificateId || '', certificateStatus: certificate?.status || (certificate ? 'published' : 'not_prepared'), issuedAt: certificate?.issuedAt || certificate?.createdAt || null };
  }) });
});

router.post('/certificates/:resultId/prepare', allowRoles('teacher'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.resultId)) return res.status(400).json({ message: 'Invalid result identifier' });
  const result = await Result.findOne({ _id: req.params.resultId, status: 'published', percentage: { $gte: passPercentage() } }).populate('examId', 'title subject totalMarks createdBy');
  if (!result || !result.examId) return res.status(404).json({ message: 'Eligible published result not found' });
  if (String(result.examId.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'You cannot prepare a certificate for this exam' });
  try {
    let certificate = await Certificate.findOne({ resultId: result._id });
    if (certificate && (!certificate.status || certificate.status === 'published')) return res.json({ certificate, result, alreadyPublished: true });
    if (!certificate) {
      certificate = await Certificate.create({ certificateId: `EN-${crypto.randomUUID()}`, resultId: result._id, studentId: result.studentId, examId: result.examId._id, status: 'draft', preparedAt: new Date() });
    }
    return res.json({ certificate, result });
  } catch (error) {
    if (error.code === 11000) {
      const certificate = await Certificate.findOne({ resultId: result._id });
      if (certificate) return res.json({ certificate, result, alreadyPublished: certificate.status === 'published' || !certificate.status });
    }
    throw error;
  }
});

router.post('/certificates/:resultId/publish', allowRoles('teacher'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.resultId)) return res.status(400).json({ message: 'Invalid result identifier' });
  const result = await Result.findOne({ _id: req.params.resultId, status: 'published', percentage: { $gte: passPercentage() } }).populate('examId', 'title createdBy');
  if (!result || !result.examId) return res.status(404).json({ message: 'Eligible published result not found' });
  if (String(result.examId.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'You cannot publish a certificate for this exam' });
  try {
    const existing = await Certificate.findOne({ resultId: result._id });
    if (existing && (existing.status === 'published' || !existing.status)) {
      await notifyOnce({ userId: result.studentId, eventKey: `certificate-published:${result._id}`, title: 'Certificate published', message: `Your certificate for ${result.examId.title} is available.`, link: '/student/certificates', examId: result.examId._id });
      return res.json({ certificate: existing, alreadyPublished: true });
    }
    const certificate = await Certificate.findOneAndUpdate(
      { resultId: result._id },
      { $set: { status: 'published', studentId: result.studentId, examId: result.examId._id, issuedAt: new Date(), publishedAt: new Date(), issuedBy: req.user._id }, $setOnInsert: { certificateId: `EN-${crypto.randomUUID()}`, resultId: result._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await notifyOnce({ userId: result.studentId, eventKey: `certificate-published:${result._id}`, title: 'Certificate published', message: `Your certificate for ${result.examId.title} is available.`, link: '/student/certificates', examId: result.examId._id });
    return res.json({ certificate });
  } catch (error) {
    if (error.code === 11000) {
      const certificate = await Certificate.findOne({ resultId: result._id });
      if (certificate?.status === 'published' || !certificate?.status) return res.json({ certificate, alreadyPublished: true });
    }
    throw error;
  }
});

router.get('/notifications', async (req, res) => res.json({ notifications: await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(200) }));
router.get('/notifications/unread-count', async (req, res) => res.json({ unreadCount: await Notification.countDocuments({ userId: req.user._id, read: false }) }));
router.patch('/notifications/read-all', async (req, res) => {
  const result = await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  return res.json({ updatedCount: result.modifiedCount });
});
router.patch('/notifications/:id/read', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid notification identifier' });
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } }, { new: true });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
});
module.exports = router;
