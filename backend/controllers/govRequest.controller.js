import GovAuthorizationRequest from '../models/GovAuthorizationRequest.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Create a new government authorization request
export const createGovRequest = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user._id;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if user already has a pending request
    const existingRequest = await GovAuthorizationRequest.findOne({
      userId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending government authorization request',
      });
    }

    // Check if user is already authorized
    const user = await User.findById(userId);
    if (user.isGovernmentAuthorized) {
      return res.status(400).json({
        success: false,
        message: 'You are already government authorized',
      });
    }

    // Create the request
    const request = await GovAuthorizationRequest.create({
      userId,
      email: email.toLowerCase().trim(),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      request: {
        _id: request._id,
        userId: request.userId,
        email: request.email,
        status: request.status,
        createdAt: request.createdAt,
      },
    });
  } catch (error) {
    console.error('Create gov request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create government authorization request',
    });
  }
};

// Get all government requests (admin only)
export const getAllGovRequests = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const requests = await GovAuthorizationRequest.find()
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Get all gov requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch government requests',
    });
  }
};

// Get user's own request status
export const getMyGovRequest = async (req, res) => {
  try {
    const request = await GovAuthorizationRequest.findOne({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!request) {
      return res.json({
        success: true,
        request: null,
      });
    }

    res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error('Get my gov request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request status',
    });
  }
};

// Approve a government authorization request (admin only)
export const approveGovRequest = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { id } = req.params;

    const request = await GovAuthorizationRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Update request
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Update user
    const user = await User.findById(request.userId);
    if (user) {
      user.isGovernmentAuthorized = true;
      await user.save();
    }

    res.json({
      success: true,
      request,
      message: 'Government authorization approved',
    });
  } catch (error) {
    console.error('Approve gov request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request',
    });
  }
};

// Reject a government authorization request (admin only)
export const rejectGovRequest = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const request = await GovAuthorizationRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Update request
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (notes) {
      request.notes = notes;
    }
    await request.save();

    // Update user (remove authorization if it was previously granted)
    const user = await User.findById(request.userId);
    if (user) {
      user.isGovernmentAuthorized = false;
      await user.save();
    }

    res.json({
      success: true,
      request,
      message: 'Government authorization rejected',
    });
  } catch (error) {
    console.error('Reject gov request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
    });
  }
};

