const mongoose = require('mongoose');
const resultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true }, studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true, unique: true }, totalMarks: { type: Number, required: true }, obtainedMarks: { type: Number, required: true }, percentage: { type: Number, required: true }, feedback: { type: String, default: '' },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, evaluatedAt: { type: Date, default: Date.now }, status: { type: String, enum: ['pending', 'evaluated', 'published'], default: 'evaluated' },
}, { timestamps: true });
module.exports = mongoose.model('Result', resultSchema);
