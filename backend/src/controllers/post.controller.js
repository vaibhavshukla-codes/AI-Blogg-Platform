const slugify = require('slugify');
const Post = require('../models/Post');

function estimateReadingTime(content) {
  const words = content ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

async function createPost(req, res, next) {
  try {
    const { title, content, category, tags, coverImageUrl, summary, metaDescription, status } = req.body;
    if (!title || !content) {
      res.status(400);
      throw new Error('Title and content are required');
    }
    const slug = slugify(title, { lower: true, strict: true });
    const readingTimeMinutes = estimateReadingTime(content);
    const post = await Post.create({
      title,
      slug,
      content,
      category,
      tags,
      coverImageUrl,
      summary,
      metaDescription,
      readingTimeMinutes,
      author: req.user.id,
      status: status || 'draft',
    });
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

async function getPosts(req, res, next) {
  try {
    const { q, tag, category, author, sort = '-createdAt', status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { content: new RegExp(q, 'i') }];
    if (tag) filter.tags = tag;
    if (category) filter.category = category;
    if (author) filter.author = author;
    if (status) filter.status = status;
    const data = await Post.find(filter)
      .populate('author', 'name avatarUrl')
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const count = await Post.countDocuments(filter);
    res.json({ data, total: count, page: Number(page), pageSize: Number(limit) });
  } catch (err) {
    next(err);
  }
}

async function getPostBySlug(req, res, next) {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'name avatarUrl');
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    req.post = post; // for canModifyPost
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const existing = await Post.findOne({ slug: req.params.slug });
    if (!existing) {
      res.status(404);
      throw new Error('Post not found');
    }
    req.post = existing;
    const { title, content } = req.body;
    if (title) existing.title = title;
    if (content) {
      existing.content = content;
      existing.readingTimeMinutes = estimateReadingTime(content);
    }
    ['category', 'tags', 'coverImageUrl', 'summary', 'metaDescription', 'status'].forEach((k) => {
      if (req.body[k] !== undefined) existing[k] = req.body[k];
    });
    if (title) existing.slug = slugify(title, { lower: true, strict: true });
    await existing.save();
    res.json({ post: existing });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const existing = await Post.findOne({ slug: req.params.slug });
    if (!existing) {
      res.status(404);
      throw new Error('Post not found');
    }
    req.post = existing;
    await existing.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

async function toggleReaction(req, res, next) {
  try {
    const { slug } = req.params;
    const { action } = req.body; // like|dislike
    const post = await Post.findOne({ slug });
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    const userId = req.user.id;
    const pullFrom = action === 'like' ? 'dislikes' : 'likes';
    const pushTo = action === 'like' ? 'likes' : 'dislikes';
    post[pullFrom] = post[pullFrom].filter((id) => String(id) !== userId);
    if (!post[pushTo].some((id) => String(id) === userId)) post[pushTo].push(userId);
    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost, getPosts, getPostBySlug, updatePost, deletePost, toggleReaction };
async function setStatus(req, res, next) {
  try {
    const { slug } = req.params;
    const { status, reason } = req.body; // pending|published|rejected
    const post = await Post.findOneAndUpdate({ slug }, { status, moderationReason: reason }, { new: true });
    if (!post) { res.status(404); throw new Error('Post not found'); }
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

async function incrementViews(req, res, next) {
  try {
    const { slug } = req.params;
    const post = await Post.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true });
    if (!post) { res.status(404); throw new Error('Post not found'); }
    res.json({ views: post.views });
  } catch (err) { next(err); }
}

module.exports = { createPost, getPosts, getPostBySlug, updatePost, deletePost, toggleReaction, setStatus, incrementViews };



