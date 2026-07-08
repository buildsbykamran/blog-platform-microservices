const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
      data: {}
    });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      data: {}
    });
  }
};

module.exports = authMiddleware;
