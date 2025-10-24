const Comment = require('../models/Comment');
const Post = require('../models/Post');

async function addComment(req, res, next) {
  try {
    const { postId, content, parent } = req.body;
    if (!postId || !content) {
      res.status(400);
      throw new Error('postId and content required');
    }
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    const comment = await Comment.create({ post: postId, author: req.user.id, content, parent: parent || null });
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId }).sort('createdAt');
    res.json({ comments });
  } catch (err) {
    next(err);
  }
}

async function toggleReaction(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // like|dislike
    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    const userId = req.user.id;
    const pullFrom = action === 'like' ? 'dislikes' : 'likes';
    const pushTo = action === 'like' ? 'likes' : 'dislikes';
    comment[pullFrom] = comment[pullFrom].filter((uid) => String(uid) !== userId);
    if (!comment[pushTo].some((uid) => String(uid) === userId)) comment[pushTo].push(userId);
    await comment.save();
    res.json({ comment });
  } catch (err) {
    next(err);
  }
}

async function moderate(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body; // visible|hidden
    const comment = await Comment.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ comment });
  } catch (err) {
    next(err);
  }
}

module.exports = { addComment, getComments, toggleReaction, moderate };



