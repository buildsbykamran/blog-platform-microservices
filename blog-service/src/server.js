const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3002;
const corsOrigin = process.env.CORS_ORIGIN || '*';

connectDB();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'blog-service', status: 'ok' });
});

app.use('/api', postRoutes);
app.use('/api', commentRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Blog service running on port ${PORT}`);
});
