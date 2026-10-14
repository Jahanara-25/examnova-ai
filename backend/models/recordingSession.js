const mongoose = require('mongoose');
const recordingSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'ready', 'recording', 'uploading', 'interrupted', 'finalizing', 'complete', 'incomplete', 'failed'], default: 'pending', index: true },
  startedAt: Date, endedAt: Date, durationSeconds: { type: Number, default: 0 },
  nextSequence: { type: Number, default: 0 }, chunkCount: { type: Number, default: 0 }, acknowledgedUploads: { type: Number, default: 0 },
  lastUploadAt: Date, finalSequence: Number, storagePrefix: { type: String, required: true },
  consentedAt: { type: Date, required: true }, policyVersion: { type: String, required: true },
  failureReason: { type: String, default: '' }, retentionExpiresAt: { type: Date, required: true },
}, { timestamps: true });
module.exports = mongoose.model('RecordingSession', recordingSessionSchema);
