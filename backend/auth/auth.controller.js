import User from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide name, email, and password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Generate token for immediate login after signup
    const token = generateToken(user._id);

    // Return success response with token and user
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isGovernmentAuthorized: user.isGovernmentAuthorized || false,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during signup' 
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
export const login = async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Login attempt failed: MongoDB not connected');
      return res.status(503).json({ 
        success: false,
        message: 'Database connection unavailable. Please try again in a moment.' 
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email.toLowerCase()}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if password exists (should always exist, but safety check)
    if (!user.password) {
      console.error('Login error: User found but password field is missing');
      return res.status(500).json({ 
        success: false,
        message: 'Server error during login' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log(`Login attempt failed: Invalid password for email ${email.toLowerCase()}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isGovernmentAuthorized: user.isGovernmentAuthorized || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        success: false,
        message: 'Database connection unavailable. Please try again in a moment.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
export const getMe = async (req, res) => {
  try {
    // User is attached to request by requireAuth middleware
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isGovernmentAuthorized: user.isGovernmentAuthorized || false,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @route   POST /api/auth/admin-authorize
// @desc    Authorize user as admin using passkey
// @access  Private
export const adminAuthorize = async (req, res) => {
  try {
    const { passkey } = req.body;

    if (!passkey) {
      return res.status(400).json({
        success: false,
        message: 'Passkey is required'
      });
    }

    const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || 'admin-secret-passkey-123';

    if (passkey !== ADMIN_PASSKEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin passkey'
      });
    }

    // Update user to be admin
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isAdmin = true;
    await user.save();

    res.json({
      success: true,
      message: 'Admin authorization successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isGovernmentAuthorized: user.isGovernmentAuthorized || false,
      },
    });
  } catch (error) {
    console.error('Admin authorize error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin authorization'
    });
  }
};

// @route   POST /api/auth/government-authorize
// @desc    Create a government authorization request (new flow)
// @access  Private
export const governmentAuthorize = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Import here to avoid circular dependency
    const GovAuthorizationRequest = (await import('../models/GovAuthorizationRequest.js')).default;

    // Check if user already has a pending request
    const existingRequest = await GovAuthorizationRequest.findOne({
      userId: req.user._id,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending government authorization request',
      });
    }

    // Check if user is already authorized
    const user = await User.findById(req.user._id);
    if (user.isGovernmentAuthorized) {
      return res.status(400).json({
        success: false,
        message: 'You are already government authorized',
      });
    }

    // Create the request
    const request = await GovAuthorizationRequest.create({
      userId: req.user._id,
      email: email.toLowerCase().trim(),
      status: 'pending',
    });

    res.json({
      success: true,
      message: 'Government authorization request created successfully',
      request: {
        _id: request._id,
        userId: request.userId,
        email: request.email,
        status: request.status,
        createdAt: request.createdAt,
      },
    });
  } catch (error) {
    console.error('Government authorize error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during government authorization'
    });
  }
};

