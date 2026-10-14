const test = require('node:test');
const assert = require('node:assert/strict');
const JSZip = require('jszip');
const { sourceExtension, extractDocumentText, validateGeneratedQuestions, parseProviderQuestions, generateQuestions } = require('../lib/documentQuestionGenerator');

const sampleQuestion = { questionText: 'Which process converts liquid water to vapour?', options: ['Evaporation', 'Freezing', 'Condensation', 'Deposition'], correctAnswer: 'Evaporation' };

test('source file type detection accepts only PDF, DOCX, and TXT', () => {
  assert.equal(sourceExtension('Lesson.PDF'), '.pdf');
  assert.equal(sourceExtension('lesson.docx'), '.docx');
  assert.equal(sourceExtension('lesson.txt'), '.txt');
  assert.equal(sourceExtension('lesson.doc'), '');
});

test('TXT source is extracted and normalized from its actual bytes', async () => {
  const text = 'Water cycle notes: evaporation changes liquid water into water vapour. '.repeat(2);
  assert.equal(await extractDocumentText(Buffer.from(text), 'water.txt'), text.trim());
});

test('DOCX body text is extracted from its document XML', async () => {
  const archive = new JSZip();
  archive.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX source paragraph with enough actual text to pass extraction minimum.</w:t></w:r></w:p><w:p><w:r><w:t>Second paragraph text.</w:t></w:r></w:p></w:body></w:document>');
  const buffer = await archive.generateAsync({ type: 'nodebuffer' });
  assert.match(await extractDocumentText(buffer, 'lesson.docx'), /DOCX source paragraph/);
});

test('PDF text is extracted using the current PDF parser API', async () => {
  const stream = 'BT /F1 12 Tf 72 720 Td (A PDF source containing enough meaningful text for the question generation process to read correctly.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  assert.match(await extractDocumentText(Buffer.from(pdf), 'lesson.pdf'), /PDF source containing enough meaningful text/);
});

test('generated questions are validated and retain selected difficulty', () => {
  const [question] = validateGeneratedQuestions({ questions: [sampleQuestion] }, 'hard');
  assert.equal(question.difficulty, 'hard');
  assert.equal(question.questionType, 'mcq');
  assert.equal(question.correctAnswer, question.options[0]);
  assert.throws(() => validateGeneratedQuestions({ questions: [{ ...sampleQuestion, correctAnswer: 'unknown' }] }, 'easy'), /incomplete MCQ/);
  assert.throws(() => parseProviderQuestions('not json', 'medium'), /unreadable output/);
});

test('generation fails honestly without a configured provider key', async () => {
  let called = false;
  await assert.rejects(() => generateQuestions({ text: 'source', subject: 'Science', difficulty: 'easy', count: 3, env: {}, fetchImpl: async () => { called = true; } }), /not configured/);
  assert.equal(called, false);
});

test('generation sends source and difficulty to provider and validates its response', async () => {
  let request;
  const questions = await generateQuestions({
    text: 'Verified source text', subject: 'Science', difficulty: 'medium', count: 1,
    env: { OPENAI_API_KEY: 'test-key', AI_QUESTION_MODEL: 'test-model' },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ questions: [sampleQuestion] }) } }] }) };
    },
  });
  assert.equal(request.url, 'https://api.openai.com/v1/chat/completions');
  assert.match(request.options.body, /Verified source text/);
  assert.match(request.options.body, /Difficulty: medium/);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].difficulty, 'medium');
});
