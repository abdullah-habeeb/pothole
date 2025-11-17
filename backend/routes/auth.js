import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.status(201).json({
      message: 'User created successfully',
      access_token: token,
      token_type: 'Bearer',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.name, // For compatibility with frontend
        is_government: user.isGovernment || false,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Support both email and username for compatibility
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    // Find user by email (username can also be email)
    const user = await User.findOne({ 
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { name: loginIdentifier }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.json({
      message: 'Login successful',
      access_token: token,
      token_type: 'Bearer',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.name, // For compatibility with frontend
        is_government: user.isGovernment || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.name, // For compatibility with frontend
      is_government: user.isGovernment || false,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint just confirms the logout
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

export default router;

