const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1000,
      trim: true
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1 });
commentSchema.index({ authorId: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
