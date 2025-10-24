const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String },
    category: { type: String, index: true },
    tags: [{ type: String, index: true }],
    summary: { type: String },
    readingTimeMinutes: { type: Number, default: 1 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'draft' },
    views: { type: Number, default: 0 },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);



