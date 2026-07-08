const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { uploadToS3, deleteFromS3 } = require('../config/aws');

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 200;
const MIN_CONTENT_LENGTH = 10;

const slugify = (value) =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const getUserId = (user) => user?.userId || user?.id || user?._id;
const getAuthorName = (user) => user?.fullName || user?.username || user?.email || 'Unknown author';
const isAdmin = (user) => user?.role === 'admin';

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizePost = (post) => ({
  id: post._id,
  title: post.title,
  slug: post.slug,
  content: post.content,
  excerpt: post.excerpt,
  authorId: post.authorId,
  authorName: post.authorName,
  featuredImage: post.featuredImage,
  tags: post.tags,
  isPublished: post.isPublished,
  viewCount: post.viewCount,
  status: post.status,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  publishedAt: post.publishedAt
});

const validatePostInput = ({ title, content }, partial = false) => {
  if (!partial || title !== undefined) {
    if (!title || title.trim().length < MIN_TITLE_LENGTH || title.trim().length > MAX_TITLE_LENGTH) {
      return 'Title must be between 5 and 200 characters';
    }
  }

  if (!partial || content !== undefined) {
    if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
      return 'Content must be at least 10 characters long';
    }
  }

  return null;
};

const ensureAuthorOrAdmin = (post, user) => {
  const userId = getUserId(user);
  return isAdmin(user) || post.authorId.toString() === String(userId);
};

const uploadFeaturedImage = async (file) => {
  if (!file) {
    return { url: '', key: '' };
  }

  return uploadToS3(file, 'posts');
};

exports.createPost = async (req, res, next) => {
  try {
    const { title, content, excerpt, tags, status = 'draft' } = req.body;
    const validationError = validatePostInput({ title, content });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const userId = getUserId(req.user);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const image = await uploadFeaturedImage(req.file);
    const post = await Post.create({
      title: title.trim(),
      slug: slugify(title),
      content: content.trim(),
      excerpt,
      tags,
      status,
      featuredImage: image.url,
      featuredImageKey: image.key,
      authorId: userId,
      authorName: getAuthorName(req.user)
    });

    return res.status(201).json({
      success: true,
      post: normalizePost(post)
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const status = req.query.status || 'published';
    const skip = (page - 1) * limit;
    const query = { status };

    const [posts, total] = await Promise.all([
      Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      posts: posts.map(normalizePost),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPostBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = await Comment.find({ postId: post._id, isApproved: true }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      post: normalizePost(post),
      comments
    });
  } catch (error) {
    return next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!ensureAuthorOrAdmin(post, req.user)) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this post' });
    }

    const validationError = validatePostInput(req.body, true);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (req.file) {
      if (post.featuredImageKey) {
        await deleteFromS3(post.featuredImageKey);
      }

      const image = await uploadFeaturedImage(req.file);
      post.featuredImage = image.url;
      post.featuredImageKey = image.key;
    }

    if (req.body.title !== undefined) {
      post.title = req.body.title.trim();
      post.slug = slugify(req.body.title);
    }
    if (req.body.content !== undefined) post.content = req.body.content.trim();
    if (req.body.excerpt !== undefined) post.excerpt = req.body.excerpt;
    if (req.body.tags !== undefined) post.tags = req.body.tags;
    if (req.body.status !== undefined) post.status = req.body.status;

    await post.save();

    return res.status(200).json({
      success: true,
      post: normalizePost(post)
    });
  } catch (error) {
    return next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!ensureAuthorOrAdmin(post, req.user)) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
    }

    if (post.featuredImageKey) {
      await deleteFromS3(post.featuredImageKey);
    }

    await Comment.deleteMany({ postId: post._id });
    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    return next(error);
  }
};

exports.searchPosts = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();

    if (q.length < 2) {
      return res.status(400).json({ success: false, message: 'Search term must be at least 2 characters' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const posts = await Post.find({
      isPublished: true,
      $or: [{ title: regex }, { content: regex }, { tags: regex }]
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      posts: posts.map(normalizePost)
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPostsByAuthor = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const skip = (page - 1) * limit;
    const query = {
      authorId: req.params.authorId,
      isPublished: true
    };

    const [posts, total] = await Promise.all([
      Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      posts: posts.map(normalizePost),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return next(error);
  }
};
