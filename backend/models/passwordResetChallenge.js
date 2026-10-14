const mongoose = require('mongoose');

const passwordResetChallengeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['student', 'teacher'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  otpHash: { type: String, default: null },
  status: { type: String, enum: ['pending', 'verified', 'resetting', 'used', 'delivery-failed', 'locked'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  resendAfter: { type: Date, required: true },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
}, { timestamps: true });

passwordResetChallengeSchema.index({ email: 1, role: 1 }, { unique: true });
passwordResetChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetChallenge', passwordResetChallengeSchema);
