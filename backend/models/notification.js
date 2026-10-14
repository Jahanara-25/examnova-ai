const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', index: true }, title: { type: String, required: true }, message: { type: String, required: true }, read: { type: Boolean, default: false }, link: String, eventKey: { type: String } }, { timestamps: true });
notificationSchema.index({ userId: 1, eventKey: 1 }, { unique: true, partialFilterExpression: { eventKey: { $type: 'string' } } });
module.exports = mongoose.model('Notification', notificationSchema);
