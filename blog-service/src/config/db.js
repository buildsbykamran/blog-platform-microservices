const mongoose = require('mongoose');

const MAX_RETRIES = Number(process.env.DB_MAX_RETRIES) || 5;
const RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS) || 5000;

const isValidMongoUri = (uri) => /^mongodb(\+srv)?:\/\/.+/i.test(uri || '');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!isValidMongoUri(uri)) {
    console.error('Invalid or missing MONGODB_URI for blog-service');
    process.exit(1);
  }

  mongoose.connection.on('connected', () => console.log('Blog MongoDB connected'));
  mongoose.connection.on('error', (error) => console.error('Blog MongoDB error:', error.message));
  mongoose.connection.on('disconnected', () => console.warn('Blog MongoDB disconnected'));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 1,
        serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
        socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS) || 45000
      });
      return mongoose.connection;
    } catch (error) {
      console.error(`Blog MongoDB connection attempt ${attempt} failed:`, error.message);

      if (attempt === MAX_RETRIES) {
        process.exit(1);
      }

      await wait(RETRY_DELAY_MS);
    }
  }
};

module.exports = connectDB;
