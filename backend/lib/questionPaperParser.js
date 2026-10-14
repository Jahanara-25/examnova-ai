const { PDFParse } = require('pdf-parse');

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function marksFrom(value) {
  const match = String(value || '').match(/(?:\(\s*(\d{1,2})\s*(?:(?:marks?|points?)\s*)?\)|\[\s*(\d{1,2})\s*\]|\b(\d{1,2})\s*(?:marks?|points?)\b)/i);
  const marks = Number(match?.[1] || match?.[2] || match?.[3]);
  return Number.isInteger(marks) && marks >= 1 && marks <= 5 ? marks : 1;
}

function parseAnswerKey(lines) {
  const answers = new Map();
  let inKey = false;
  for (const line of lines) {
    if (/^\s*(?:answer\s*key|correct\s*answers?)\s*:?\s*$/i.test(line)) { inKey = true; continue; }
    if (!inKey) continue;
    const match = line.match(/^\s*(?:q(?:uestion)?\s*)?(\d{1,3})\s*[.)\-:]\s*(.+?)\s*$/i)
      || line.match(/^\s*(?:q(?:uestion)?\s*)?(\d{1,3})\s+([A-D])\s*$/i);
    if (match) answers.set(Number(match[1]), match[2].trim());
  }
  return answers;
}

function parseQuestionPaperText(text) {
  const normalizedText = String(text || '').replace(/\r/g, '')
    .replace(/(^|\s)((?:section|part)\s+[A-Z0-9IVX]+\b)/gi, '$1\n$2')
    .replace(/(^|\s)(answer\s*key|correct\s*answers?)\s*:?/gi, '$1\n$2:')
    .replace(/(^|\s)((?:q(?:uestion)?\s*)?\d{1,3}[.)])\s+/gi, '$1\n$2 ')
    .replace(/(^|\s)(\(?[A-D]\)?[).:])\s+/gi, '$1\n$2 ');
  const lines = normalizedText.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (lines.join(' ').replace(/\s/g, '').length < 25) {
    throw new Error('No readable text was found. This may be a scanned/image-only PDF; OCR is not configured, so no questions were imported.');
  }
  const answerKey = parseAnswerKey(lines);
  const questions = [];
  let section = '';
  let current = null;
  let inKey = false;
  const flush = () => {
    if (!current) return;
    current.questionText = current.questionText.trim();
    current.options = current.options.map((option) => option.trim());
    const choices = current.options.filter(Boolean);
    if (choices.length >= 2) {
      current.questionType = 'mcq';
      while (current.options.length < 4) current.options.push('');
      if (current.options.length > 4) current.options = current.options.slice(0, 4);
      const answerValue = answerKey.get(current.number);
      const answerLetter = /^[A-D]$/i.test(answerValue || '') ? answerValue.toUpperCase() : '';
      current.correctAnswer = answerLetter ? current.options[answerLetter.charCodeAt(0) - 65] || '' : current.correctAnswer;
      current.answerScheme = '';
    } else {
      current.questionType = current.questionText.length > 180 || current.marks >= 4 ? 'descriptive' : 'short-answer';
      current.options = [];
      current.correctAnswer = '';
      current.answerScheme ||= answerKey.get(current.number) || '';
    }
    delete current.number;
    if (current.questionText) questions.push(current);
    current = null;
  };

  for (const line of lines) {
    if (/^\s*(?:answer\s*key|correct\s*answers?)\s*:?\s*$/i.test(line)) { flush(); inKey = true; continue; }
    if (inKey) continue;
    const sectionMatch = line.match(/^\s*(?:section|part)\s+[A-Z0-9IVX]+\b.*$/i);
    if (sectionMatch) { flush(); section = line.replace(/\s*\(\s*\d+\s*marks?\s*\)\s*$/i, '').trim(); continue; }
    const questionMatch = line.match(/^\s*(?:q(?:uestion)?\s*)?(\d{1,3})\s*[.):\-]\s*(.+)$/i);
    if (questionMatch) {
      flush();
      const raw = questionMatch[2];
      const markMatch = raw.match(/\s*(?:\(\s*\d{1,2}\s*(?:(?:marks?|points?)\s*)?\)|\[\s*\d{1,2}\s*\]|\b\d{1,2}\s*(?:marks?|points?)\b)\s*$/i);
      current = { number: Number(questionMatch[1]), questionText: markMatch ? raw.slice(0, markMatch.index).trim() : raw, questionType: 'short-answer', options: ['', '', '', ''], correctAnswer: '', marks: marksFrom(raw), section, answerScheme: '', source: 'paper' };
      continue;
    }
    if (!current) continue;
    const optionMatch = line.match(/^\s*(?:\(([A-D])\)|([A-D])[).:])\s*(.+)$/i);
    if (optionMatch) {
      const optionIndex = (optionMatch[1] || optionMatch[2]).toUpperCase().charCodeAt(0) - 65;
      if (optionIndex < 4) current.options[optionIndex] = optionMatch[3].trim();
      continue;
    }
    const trailingMarks = line.match(/^\s*\(\s*(\d{1,2})\s*marks?\s*\)\s*$/i);
    if (trailingMarks) { current.marks = marksFrom(line); continue; }
    const answerMatch = line.match(/^\s*(?:answer|suggested answer|marking scheme)\s*:\s*(.+)$/i);
    if (answerMatch) { current.answerScheme = answerMatch[1].trim(); continue; }
    const lastOptionIndex = current.options.findLastIndex((option) => Boolean(option));
    if (lastOptionIndex >= 0) current.options[lastOptionIndex] += ` ${line}`;
    else current.questionText += `${current.questionText ? ' ' : ''}${line}`;
  }
  flush();
  if (!questions.length) throw new Error('The PDF contains readable text, but no numbered questions could be identified. Use the manual editor or correct the PDF text layout.');
  return questions;
}

async function extractQuestionPaperPdf(buffer, filename, mimeType) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_PDF_BYTES) throw new Error('Choose a non-empty PDF no larger than 10 MB.');
  if (!String(filename || '').toLowerCase().endsWith('.pdf') || (mimeType && mimeType !== 'application/pdf' && mimeType !== 'application/octet-stream')) throw new Error('Upload a PDF question paper.');
  if (buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('The selected file is not a valid PDF.');
  const parser = new PDFParse({ data: buffer });
  let text;
  try { text = (await parser.getText()).text; }
  finally { await parser.destroy(); }
  return { text, questions: parseQuestionPaperText(text) };
}

module.exports = { MAX_PDF_BYTES, marksFrom, parseQuestionPaperText, extractQuestionPaperPdf };
