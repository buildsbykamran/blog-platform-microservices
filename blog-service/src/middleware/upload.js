const multer = require('multer');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ACCEPTED_IMAGE_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }

  const error = new Error('Only jpeg, png, gif, and webp images are allowed');
  error.status = 400;
  return cb(error);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

const handleMulterErrors = (middleware) => (req, res, next) => {
  middleware(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size exceeds 5MB limit'
      });
    }

    return res.status(error.status || 400).json({
      message: error.message || 'File upload failed'
    });
  });
};

const uploadSingle = (fieldName = 'image') => handleMulterErrors(uploader.single(fieldName));
const uploadMultiple = (fieldName = 'images', maxCount = 10) =>
  handleMulterErrors(uploader.array(fieldName, maxCount));

module.exports = {
  uploadSingle,
  uploadMultiple,
  single: (fieldName) => uploadSingle(fieldName),
  array: (fieldName, maxCount) => uploadMultiple(fieldName, maxCount)
};
