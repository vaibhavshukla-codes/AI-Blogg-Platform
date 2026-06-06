const Notification = require('../models/Notification');

async function createNotification({ userId, type, message, meta }) {
  if (!userId) return;
  try {
    await Notification.create({
      user: userId,
      type,
      message,
      meta,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = { createNotification };
