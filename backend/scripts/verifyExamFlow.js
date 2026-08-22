const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/user');
const Exam = require('../models/exam');
const Question = require('../models/question');
const Submission = require('../models/submission');
const Result = require('../models/result');
const Notification = require('../models/notification');

const apiBase = process.env.VERIFY_API_BASE_URL || 'http://localhost:5000/api';
const tag = `FLOW_VERIFY_${Date.now()}`;
const email = (role) => `${tag.toLowerCase()}_${role}@example.test`;
let teacherId, studentId, examId;

async function request(pathname, { token, ...options } = {}) {
  const response = await fetch(`${apiBase}${pathname}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${pathname}: ${response.status} ${body.message || 'failed'}`);
  return body;
}
async function registerAndLogin(role) {
  const payload = { name: `${tag} ${role}`, email: email(role), password: 'VerifyPass123!', role, ...(role === 'student' ? { rollNumber: tag, department: tag } : {}) };
  await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: payload.email, password: payload.password }) });
  return login;
}
async function cleanup() {
  const users = await User.find({ email: new RegExp(`^${tag.toLowerCase()}`) }).select('_id');
  const userIds = users.map((user) => user._id);
  const exams = await Exam.find({ title: tag }).select('_id');
  const examIds = exams.map((exam) => exam._id);
  await Promise.all([Notification.deleteMany({ userId: { $in: userIds } }), Result.deleteMany({ $or: [{ studentId: { $in: userIds } }, { examId: { $in: examIds } }] }), Submission.deleteMany({ $or: [{ studentId: { $in: userIds } }, { examId: { $in: examIds } }] }), Question.deleteMany({ $or: [{ createdBy: { $in: userIds } }, { examId: { $in: examIds } }] }), Exam.deleteMany({ _id: { $in: examIds } }), User.deleteMany({ _id: { $in: userIds } })]);
}
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const teacher = await registerAndLogin('teacher'); const student = await registerAndLogin('student');
    teacherId = teacher.user.id; studentId = student.user.id;
    const now = Date.now();
    const created = await request('/exams', { token: teacher.token, method: 'POST', body: JSON.stringify({ title: tag, subject: 'Verification', department: tag, duration: 10, totalMarks: 2, startDate: new Date(now - 60000).toISOString(), endDate: new Date(now + 600000).toISOString(), instructions: 'Verification only' }) }); examId = created.exam._id;
    const question = await request('/questions', { token: teacher.token, method: 'POST', body: JSON.stringify({ examId, questionText: tag, subject: 'Verification', questionType: 'mcq', options: ['Correct', 'Wrong A', 'Wrong B', 'Wrong C'], correctAnswer: 'Correct', marks: 2 }) });
    await request(`/exams/${examId}/publish`, { token: teacher.token, method: 'POST' });
    const available = await request('/exams/available', { token: student.token }); if (!available.exams.some((exam) => exam._id === examId)) throw new Error('Published exam was not visible to matching student');
    const attempt = await request(`/submissions/${examId}/start`, { token: student.token, method: 'POST' });
    await request(`/submissions/${examId}/answers`, { token: student.token, method: 'PUT', body: JSON.stringify({ answers: [{ questionId: question.question._id, selectedAnswer: 'Correct' }] }) });
    await request(`/submissions/${examId}/submit`, { token: student.token, method: 'POST', body: JSON.stringify({}) });
    const submissions = await request('/submissions/teacher/list', { token: teacher.token }); const submission = submissions.submissions.find((item) => item.examId?._id === examId); if (!submission) throw new Error('Teacher did not receive the student submission');
    await request(`/submissions/teacher/${submission._id}/evaluate`, { token: teacher.token, method: 'POST', body: JSON.stringify({ answers: [{ questionId: question.question._id, marksAwarded: 2 }], feedback: 'Verified', finalize: true }) });
    const results = await request('/results', { token: student.token }); const result = results.results.find((item) => item.examId?._id === examId); if (!result || result.obtainedMarks !== 2 || result.status !== 'published') throw new Error('Published result was not visible to student');
    console.log('PASS: teacher create -> publish -> student take -> teacher manual evaluation -> student result');
  } finally { await cleanup(); await mongoose.disconnect(); }
}
main().catch(async (error) => { console.error(`FAIL: ${error.message}`); try { await cleanup(); await mongoose.disconnect(); } catch {} process.exitCode = 1; });
