const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

const router = express.Router();

router.post('/posts/:postId/comments', authMiddleware, createComment);
router.get('/posts/:postId/comments', getCommentsByPost);
router.put('/comments/:commentId', authMiddleware, updateComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
