const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  bio: user.bio,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const validateRegistration = ({ username, email, password }) => {
  if (!username || username.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }

  if (!email || !emailRegex.test(email)) {
    return 'A valid email address is required';
  }

  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  return null;
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;
    const validationError = validateRegistration({ username, email, password });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError, data: {} });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}`,
        data: {}
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      fullName
    });

    return res.status(201).json({
      success: true,
      message: 'User created',
      data: {
        userId: user._id
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate email or username',
        data: {}
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: {}
      });
    }

    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: {}
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', data: {} });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid password', data: {} });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: createToken(user),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', data: {} });
    }

    return res.json({
      success: true,
      message: 'Profile fetched',
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, profileImage } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', data: {} });
    }

    return res.json({
      success: true,
      message: 'Profile updated',
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: {}
      });
    }

    return next(error);
  }
};

exports.verifyToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
      data: {}
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({
      success: true,
      message: 'Token is valid',
      data: {
        valid: true,
        userId: decoded.userId,
        email: decoded.email
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      data: {
        valid: false
      }
    });
  }
};
