const test = require('node:test');
const assert = require('node:assert/strict');
const Question = require('../models/question');
const { scoreObjectiveAnswers } = require('../lib/examScoring');
const { parseQuestionPaperText, extractQuestionPaperPdf } = require('../lib/questionPaperParser');

function createTextPdf(lines) {
  const escape = (value) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 12 Tf 72 720 Td ${lines.map((line) => `(${escape(line)}) Tj T*`).join(' ')} ET`;
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
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

test('text extraction parser recognizes sections, numbered MCQs, marks, and answer keys', () => {
  const questions = parseQuestionPaperText(`SECTION A — Objective (2 marks each)
1. Which number is even? (2 marks)
A) 3
B) 4
C) 5
D) 7
Answer Key:
1. B`);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].section, 'SECTION A — Objective (2 marks each)');
  assert.equal(questions[0].questionType, 'mcq');
  assert.equal(questions[0].marks, 2);
  assert.deepEqual(questions[0].options, ['3', '4', '5', '7']);
  assert.equal(questions[0].correctAnswer, '4');
});

test('parser recognizes short and descriptive questions and a written marking scheme', () => {
  const [shortQuestion, longQuestion] = parseQuestionPaperText(`1. Define a variable. (1 mark)
Answer: A named storage location.
2. Explain how an operating system manages memory and processes. (5 marks)`);
  assert.equal(shortQuestion.questionType, 'short-answer');
  assert.equal(shortQuestion.answerScheme, 'A named storage location.');
  assert.equal(longQuestion.questionType, 'descriptive');
  assert.equal(longQuestion.marks, 5);
});

test('question schema accepts very-short-answer alongside older saved types', () => {
  const types = Question.schema.path('questionType').enumValues;
  assert.deepEqual(types, ['mcq', 'very-short-answer', 'short-answer', 'descriptive']);
});

test('question schema indexes staged paper save keys for retry idempotency', () => {
  const index = Question.schema.indexes().find(([keys]) => keys.paperDraftKey === 1);
  assert.ok(index);
  assert.equal(index[1].unique, true);
  assert.equal(index[1].partialFilterExpression.paperDraftKey.$type, 'string');
});

test('objective scoring uses each saved question mark value and leaves written answers for manual grading', () => {
  const questions = [
    { _id: 'one', questionType: 'mcq', correctAnswer: 'B', marks: 3 },
    { _id: 'two', questionType: 'mcq', correctAnswer: 'yes', marks: 5 },
    { _id: 'three', questionType: 'descriptive', marks: 5 },
  ];
  const scored = scoreObjectiveAnswers(questions, [
    { questionId: 'one', selectedAnswer: 'B' },
    { questionId: 'two', selectedAnswer: 'no' },
    { questionId: 'three', selectedAnswer: 'written response' },
  ]);
  assert.equal(scored.objectiveMarks, 3);
  assert.deepEqual(scored.answers.map((answer) => answer.marksAwarded), [3, 0, null]);
});

test('parser refuses PDFs with no readable text rather than returning fake questions', () => {
  assert.throws(() => parseQuestionPaperText(''), /scanned\/image-only PDF|OCR is not configured/);
  assert.throws(() => parseQuestionPaperText('Readable cover page but no numbered question items.'), /no numbered questions/);
});

test('PDF endpoint parser rejects non-PDF bytes and unsupported file metadata', async () => {
  await assert.rejects(() => extractQuestionPaperPdf(Buffer.from('not a pdf'), 'paper.pdf', 'application/pdf'), /valid PDF/);
  await assert.rejects(() => extractQuestionPaperPdf(Buffer.from('%PDF-x'), 'paper.txt', 'text/plain'), /Upload a PDF/);
});

test('PDF parser extracts actual text and produces reviewable questions from a PDF file', async () => {
  const file = createTextPdf(['SECTION A', '1. Which value is even? (1 mark)', 'A) 3', 'B) 4', 'C) 5', 'D) 7', 'Answer Key:', '1. B']);
  const result = await extractQuestionPaperPdf(file, 'questions.pdf', 'application/pdf');
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].questionText, 'Which value is even?');
  assert.equal(result.questions[0].correctAnswer, '4');
});
