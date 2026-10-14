const Notification = require('../models/notification');

async function notifyOnce({ userId, eventKey, title, message, link, examId }) {
  try {
    await Notification.updateOne(
      { userId, eventKey },
      { $setOnInsert: { userId, eventKey, title, message, link, examId, read: false } },
      { upsert: true },
    );
  } catch (error) {
    // A concurrent retry can win the unique event key. Other database failures must surface.
    if (error.code !== 11000) throw error;
  }
}

module.exports = { notifyOnce };
