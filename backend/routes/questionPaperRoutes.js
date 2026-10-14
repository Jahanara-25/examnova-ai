const express = require('express');
const multer = require('multer');
const { requireAuth, allowRoles } = require('../middleware/auth');
const Exam = require('../models/exam');
const { extractQuestionPaperPdf } = require('../lib/questionPaperParser');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

router.post('/extract-pdf', requireAuth, allowRoles('teacher'), (req, res, next) => {
  upload.single('paper')(req, res, (error) => {
    if (!error) return next();
    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: error.message || 'Unable to read the PDF upload.' });
  });
}, async (req, res) => {
  try {
    const examId = String(req.body.examId || '');
    if (!/^[a-f\d]{24}$/i.test(examId)) return res.status(400).json({ message: 'Select a valid draft exam before uploading a question paper.' });
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id, status: 'draft' });
    if (!exam) return res.status(404).json({ message: 'Draft exam not found or unavailable to this teacher.' });
    if (!req.file) return res.status(400).json({ message: 'Choose a PDF question paper to upload.' });
    const parsed = await extractQuestionPaperPdf(req.file.buffer, req.file.originalname, req.file.mimetype);
    return res.json({ sourceName: req.file.originalname, questionCount: parsed.questions.length, questions: parsed.questions });
  } catch (error) {
    const message = error.message || 'Could not extract questions from this PDF.';
    const status = /no larger|Choose|Upload|valid PDF/.test(message) ? 400 : 422;
    return res.status(status).json({ message });
  }
});

module.exports = router;
