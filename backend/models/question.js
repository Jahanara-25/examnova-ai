const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', index: true },
  questionText: { type: String, required: true, trim: true }, questionType: { type: String, enum: ['mcq', 'very-short-answer', 'short-answer', 'descriptive'], default: 'mcq' },
  options: { type: [String], default: [] }, correctAnswer: { type: String, default: '' }, marks: { type: Number, required: true, min: 1 },
  explanation: { type: String, default: '' }, answerScheme: { type: String, default: '' }, section: { type: String, trim: true, default: '' },
  paperDraftKey: { type: String, default: undefined, maxlength: 100 },
  order: { type: Number, default: 0 }, subject: { type: String, trim: true, default: '' },
  source: { type: String, enum: ['manual', 'ai', 'paper'], default: 'manual' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });
questionSchema.index({ examId: 1, createdBy: 1, paperDraftKey: 1 }, { unique: true, partialFilterExpression: { paperDraftKey: { $type: 'string' } } });
module.exports = mongoose.model('Question', questionSchema);
