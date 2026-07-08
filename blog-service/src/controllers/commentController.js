const Comment = require('../models/Comment');
const Post = require('../models/Post');

const MIN_CONTENT_LENGTH = 1;
const MAX_CONTENT_LENGTH = 1000;

const getUserId = (user) => user?.userId || user?.id || user?._id;
const getAuthorName = (user) => user?.fullName || user?.username || user?.email || 'Unknown author';
const isAdmin = (user) => user?.role === 'admin';

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const validateContent = (content) => {
  if (typeof content !== 'string') {
    return 'Comment content is required';
  }

  const trimmed = content.trim();

  if (trimmed.length < MIN_CONTENT_LENGTH || trimmed.length > MAX_CONTENT_LENGTH) {
    return 'Comment content must be between 1 and 1000 characters';
  }

  return null;
};

const normalizeComment = (comment) => ({
  id: comment._id,
  postId: comment.postId,
  authorId: comment.authorId,
  authorName: comment.authorName,
  content: comment.content,
  isApproved: comment.isApproved,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt
});

exports.createComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const validationError = validateContent(content);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = getUserId(req.user);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const comment = await Comment.create({
      postId: post._id,
      authorId: userId,
      authorName: getAuthorName(req.user),
      content: content.trim()
    });

    return res.status(201).json({
      success: true,
      comment: normalizeComment(comment)
    });
  } catch (error) {
    return next(error);
  }
};

exports.getCommentsByPost = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const skip = (page - 1) * limit;
    const query = {
      postId: req.params.postId,
      isApproved: true
    };

    const [comments, total] = await Promise.all([
      Comment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Comment.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      comments: comments.map(normalizeComment),
      total,
      page
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const validationError = validateContent(content);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== String(getUserId(req.user))) {
      return res.status(403).json({ success: false, message: 'You can only update your own comments' });
    }

    comment.content = content.trim();
    await comment.save();

    return res.status(200).json({
      success: true,
      comment: normalizeComment(comment)
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const post = await Post.findById(comment.postId);
    const userId = String(getUserId(req.user));
    const isCommentAuthor = comment.authorId.toString() === userId;
    const isPostAuthor = post && post.authorId.toString() === userId;

    if (!isCommentAuthor && !isPostAuthor && !isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    return next(error);
  }
};

exports.approveComment = async (req, res, next) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (typeof req.body.isApproved !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isApproved must be a boolean' });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { isApproved: req.body.isApproved },
      { new: true, runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    return res.status(200).json({
      success: true,
      comment: normalizeComment(comment)
    });
  } catch (error) {
    return next(error);
  }
};
