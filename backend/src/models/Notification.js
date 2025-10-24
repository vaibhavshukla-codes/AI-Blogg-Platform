const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['comment', 'post_status', 'ai_update'], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);



