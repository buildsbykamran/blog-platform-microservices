const AWS = require('aws-sdk');
const path = require('path');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const region = process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region
});

const s3 = new AWS.S3();

const sanitizeFilename = (filename) => filename.replace(/[^a-zA-Z0-9._-]/g, '-');

const validateFile = (file) => {
  if (!file || !file.buffer || !file.originalname || !file.mimetype) {
    const error = new Error('A valid file is required');
    error.status = 400;
    throw error;
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(extension) || !SUPPORTED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('Invalid file type. Supported types: jpg, jpeg, png, gif, webp');
    error.status = 400;
    throw error;
  }

  if (file.size && file.size > MAX_FILE_SIZE) {
    const error = new Error('File size exceeds 5MB limit');
    error.status = 400;
    throw error;
  }

  if (!bucket) {
    const error = new Error('AWS S3 bucket is not configured');
    error.status = 500;
    throw error;
  }
};

const uploadToS3 = async (file, folder = 'uploads') => {
  validateFile(file);

  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
  const key = `${safeFolder}/${Date.now()}-${sanitizeFilename(file.originalname)}`;

  try {
    const result = await s3
      .upload({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      })
      .promise();

    return {
      url: result.Location,
      key
    };
  } catch (error) {
    const uploadError = new Error(`S3 upload failed: ${error.message}`);
    uploadError.status = error.statusCode || 500;
    throw uploadError;
  }
};

const deleteFromS3 = async (key) => {
  if (!key) {
    const error = new Error('S3 object key is required');
    error.status = 400;
    throw error;
  }

  if (!bucket) {
    const error = new Error('AWS S3 bucket is not configured');
    error.status = 500;
    throw error;
  }

  try {
    await s3
      .deleteObject({
        Bucket: bucket,
        Key: key
      })
      .promise();

    return { deleted: true, key };
  } catch (error) {
    const deleteError = new Error(`S3 delete failed: ${error.message}`);
    deleteError.status = error.statusCode === 404 ? 404 : error.statusCode || 500;
    throw deleteError;
  }
};

module.exports = {
  s3,
  uploadToS3,
  deleteFromS3
};
