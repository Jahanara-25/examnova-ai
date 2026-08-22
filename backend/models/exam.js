const mongoose = require('mongoose');
const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, description: { type: String, trim: true, default: '' },
  subject: { type: String, required: true, trim: true }, department: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 1 }, totalMarks: { type: Number, required: true, min: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft', index: true },
  startDate: { type: Date, required: true, index: true }, endDate: { type: Date, required: true, index: true },
  instructions: { type: String, default: '' }, eligibility: { type: [String], default: [] },
  questionPaper: { filename: String, originalName: String, mimeType: String, size: Number, uploadedAt: Date },
  timezoneVersion: { type: String, default: 'ist-v1' },
}, { timestamps: true });
module.exports = mongoose.model('Exam', examSchema);
