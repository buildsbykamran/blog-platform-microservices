const express = require('express');
const authMiddleware = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  createPost,
  getPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  searchPosts,
  getPostsByAuthor
} = require('../controllers/postController');

const router = express.Router();

router.post('/posts', authMiddleware, uploadSingle('featuredImage'), createPost);
router.get('/posts', getPosts);
router.get('/posts/search', searchPosts);
router.get('/posts/author/:authorId', getPostsByAuthor);
router.get('/posts/:slug', getPostBySlug);
router.put('/posts/:postId', authMiddleware, uploadSingle('featuredImage'), updatePost);
router.delete('/posts/:postId', authMiddleware, deletePost);

module.exports = router;
