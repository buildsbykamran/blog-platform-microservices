const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || username.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters long',
      data: {}
    });
  }

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required',
      data: {}
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
      data: {}
    });
  }

  return next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !emailRegex.test(email) || !password) {
    return res.status(400).json({
      success: false,
      message: 'Valid email and password are required',
      data: {}
    });
  }

  return next();
};

const validateVerify = (req, res, next) => {
  if (!req.body.token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
      data: {}
    });
  }

  return next();
};

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/verify', validateVerify, verifyToken);

module.exports = router;
