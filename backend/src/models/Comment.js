const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
  },
  { timestamps: true }
);

// Cascade delete: Delete all child comments when a parent comment is deleted
commentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const Comment = mongoose.model('Comment');
    const Notification = mongoose.model('Notification');
    
    const replies = await Comment.find({ parent: this._id });
    for (const reply of replies) {
      await reply.deleteOne();
    }

    await Notification.deleteMany({ 'meta.commentId': this._id.toString() });

    next();
  } catch (error) {
    console.error('Comment cascade delete error:', error);
    next(error);
  }
});

// Also handle findOneAndDelete
commentSchema.pre('findOneAndDelete', async function(next) {
  try {
    const Comment = mongoose.model('Comment');
    const Notification = mongoose.model('Notification');
    const doc = await this.model.findOne(this.getFilter());
    
    if (doc) {
      const replies = await Comment.find({ parent: doc._id });
      for (const reply of replies) {
        await reply.deleteOne();
      }

      await Notification.deleteMany({ 'meta.commentId': doc._id.toString() });
    }

    next();
  } catch (error) {
    console.error('Comment cascade delete error:', error);
    next(error);
  }
});

module.exports = mongoose.model('Comment', commentSchema);


