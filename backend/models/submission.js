const mongoose = require('mongoose');
const submissionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true }, studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answers: [{ questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }, selectedAnswer: { type: String, default: '' }, marksAwarded: { type: Number, default: null }, feedback: { type: String, default: '' } }],
  startedAt: { type: Date, required: true }, expiresAt: { type: Date, required: true }, submittedAt: Date,
  status: { type: String, enum: ['active', 'submitted'], default: 'active' }, autoSubmitted: { type: Boolean, default: false },
  objectiveMarks: { type: Number, default: 0 }, manualMarks: { type: Number, default: 0 }, finalMarks: { type: Number, default: 0 }, feedback: { type: String, default: '' }, evaluationStatus: { type: String, enum: ['pending', 'saved', 'evaluated'], default: 'pending' }, evaluatedAt: Date,
}, { timestamps: true });
submissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });
module.exports = mongoose.model('Submission', submissionSchema);
