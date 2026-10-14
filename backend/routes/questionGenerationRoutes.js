const express = require('express');
const multer = require('multer');
const { requireAuth, allowRoles } = require('../middleware/auth');
const { MIME_BY_EXTENSION, sourceExtension, extractDocumentText, generateQuestions } = require('../lib/documentQuestionGenerator');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const extension = sourceExtension(file.originalname);
    callback(extension && (!file.mimetype || file.mimetype === 'application/octet-stream' || file.mimetype === MIME_BY_EXTENSION[extension]) ? null : new Error('Upload a PDF, DOCX, or TXT file.'), Boolean(extension));
  },
});

router.post('/generate', requireAuth, allowRoles('teacher'), (req, res, next) => upload.single('source')(req, res, (error) => {
  if (!error) return next();
  return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: error.message || 'Unable to read the uploaded source.' });
}), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a PDF, DOCX, or TXT source file.' });
    const subject = typeof req.body.subject === 'string' ? req.body.subject.trim().slice(0, 100) : '';
    const difficulty = String(req.body.difficulty || '').toLowerCase();
    const count = Number(req.body.count || 5);
    if (!subject) return res.status(400).json({ message: 'Enter the subject for the generated questions.' });
    if (!['easy', 'medium', 'hard'].includes(difficulty)) return res.status(400).json({ message: 'Choose Easy, Medium, or Hard difficulty.' });
    if (!Number.isInteger(count) || count < 1 || count > 10) return res.status(400).json({ message: 'Question count must be between 1 and 10.' });
    const text = await extractDocumentText(req.file.buffer, req.file.originalname);
    const questions = await generateQuestions({ text, subject, difficulty, count });
    return res.json({ questions, sourceName: req.file.originalname, extractedCharacters: text.length });
  } catch (error) {
    const status = /not configured/.test(error.message) ? 503 : /provider/.test(error.message) || /API_KEY/.test(error.message) ? 502 : 400;
    return res.status(status).json({ message: error.message || 'Question generation failed. Check the source and try again.' });
  }
});

module.exports = router;
