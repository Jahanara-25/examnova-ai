const mongoose = require('mongoose');
const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true, index: true },
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  issuedAt: { type: Date },
  status: { type: String, enum: ['draft', 'published', null], index: true },
  preparedAt: { type: Date },
  publishedAt: { type: Date },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Certificate', certificateSchema);
