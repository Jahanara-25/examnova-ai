const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', index: true },
  questionText: { type: String, required: true, trim: true }, questionType: { type: String, enum: ['mcq', 'descriptive'], default: 'mcq' },
  options: { type: [String], default: [] }, correctAnswer: { type: String, default: '' }, marks: { type: Number, required: true, min: 1 },
  explanation: { type: String, default: '' }, order: { type: Number, default: 0 }, subject: { type: String, trim: true, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });
module.exports = mongoose.model('Question', questionSchema);
