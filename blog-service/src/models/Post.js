const mongoose = require('mongoose');

const slugify = (value) =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 200,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      minlength: 10
    },
    excerpt: {
      type: String,
      trim: true,
      default: ''
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
    featuredImage: {
      type: String,
      trim: true,
      default: ''
    },
    featuredImageKey: {
      type: String,
      trim: true,
      default: ''
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => {
        const tagList = Array.isArray(tags) ? tags : String(tags || '').split(',');
        return [...new Set(tagList.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
      }
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

postSchema.index({ authorId: 1 });
postSchema.index({ isPublished: 1 });
postSchema.index({ createdAt: -1 });

postSchema.pre('validate', async function setSlug(next) {
  if (!this.isModified('title') && this.slug) {
    return next();
  }

  const baseSlug = slugify(this.title);
  let slug = baseSlug;
  let counter = 1;

  while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  this.slug = slug;
  return next();
});

postSchema.pre('save', function setPublishedState(next) {
  if (this.status === 'published') {
    this.isPublished = true;
    this.publishedAt = this.publishedAt || new Date();
  }

  if (this.status !== 'published') {
    this.isPublished = false;
  }

  return next();
});

module.exports = mongoose.model('Post', postSchema);
