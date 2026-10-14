const mongoose = require('mongoose');
const recordingChunkSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecordingSession', required: true, index: true },
  sequence: { type: Number, required: true }, storageKey: { type: String, required: true, unique: true },
  gridFsFileId: { type: mongoose.Schema.Types.ObjectId, unique: true, sparse: true },
  sizeBytes: { type: Number, required: true }, contentType: { type: String, required: true }, sha256: { type: String, required: true },
  uploadedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });
recordingChunkSchema.index({ sessionId: 1, sequence: 1 }, { unique: true });
module.exports = mongoose.model('RecordingChunk', recordingChunkSchema);
