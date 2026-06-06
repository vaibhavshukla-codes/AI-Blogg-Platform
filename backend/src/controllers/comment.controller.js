const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createNotification } = require('../utils/notifications');

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
    if (parent) {
      const parentComment = await Comment.findOne({ _id: parent, post: postId });
      if (!parentComment) {
        res.status(400);
        throw new Error('Parent comment not found for this post');
      }
    }

    const comment = await Comment.create({ 
      post: postId, 
      author: req.user.id, 
      content: content.trim(), 
      parent: parent || null 
    });
    
    // Populate author info before returning
    await comment.populate('author', 'name avatarUrl');

    const postAuthorId = String(post.author);
    if (postAuthorId !== req.user.id) {
      await createNotification({
        userId: post.author,
        type: 'comment',
        message: `${req.user.name || 'Someone'} commented on "${post.title}"`,
        meta: { postId: post._id, commentId: comment._id, slug: post.slug },
      });
    }

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId, status: { $ne: 'hidden' } })
      .populate('author', 'name avatarUrl')
      .sort('createdAt');
    res.json({ comments });
  } catch (err) {
    next(err);
  }
}

async function toggleReaction(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // like|dislike
    if (!['like', 'dislike'].includes(action)) {
      res.status(400);
      throw new Error('Invalid reaction action');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    const userId = req.user.id;
    
    // Check if user already reacted
    const alreadyLiked = comment.likes.some((uid) => String(uid) === userId);
    const alreadyDisliked = comment.dislikes.some((uid) => String(uid) === userId);
    
    if (action === 'like') {
      // Remove from dislikes if present
      comment.dislikes = comment.dislikes.filter((uid) => String(uid) !== userId);
      
      // Toggle like
      if (alreadyLiked) {
        comment.likes = comment.likes.filter((uid) => String(uid) !== userId);
      } else {
        comment.likes.push(userId);
      }
    } else if (action === 'dislike') {
      // Remove from likes if present
      comment.likes = comment.likes.filter((uid) => String(uid) !== userId);
      
      // Toggle dislike
      if (alreadyDisliked) {
        comment.dislikes = comment.dislikes.filter((uid) => String(uid) !== userId);
      } else {
        comment.dislikes.push(userId);
      }
    }
    
    await comment.save();
    res.json({ comment });
  } catch (err) {
    next(err);
  }
}

async function updateComment(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (typeof content !== 'string' || !content.trim()) {
      res.status(400);
      throw new Error('Comment content is required');
    }
    
    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    
    // Check if user is the author
    if (String(comment.author) !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to edit this comment');
    }
    
    comment.content = content.trim();
    await comment.save();
    await comment.populate('author', 'name avatarUrl');
    
    res.json({ comment });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    
    // Check if user is the author or admin
    if (String(comment.author) !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this comment');
    }
    
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
}

async function moderate(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body; // visible|hidden
    if (!['visible', 'hidden'].includes(status)) {
      res.status(400);
      throw new Error('Invalid comment status');
    }

    const comment = await Comment.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    res.json({ comment });
  } catch (err) {
    next(err);
  }
}

async function getAllComments(req, res, next) {
  try {
    const comments = await Comment.find()
      .populate('author', 'name avatarUrl')
      .populate('post', 'title')
      .sort('-createdAt');

    res.json({ comments });
  } catch (err) {
    next(err);
  }
}


module.exports = { 
  addComment, 
  getComments, 
  toggleReaction, 
  updateComment, 
  deleteComment, 
  moderate,
  getAllComments 
};



