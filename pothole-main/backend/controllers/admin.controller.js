import User from '../models/User.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const usersWithRoles = users.map((user) => {
      let role = 'User';
      if (user.isAdmin) {
        role = 'Admin';
      } else if (user.isGovernmentAuthorized) {
        role = 'Government';
      }

      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        isAdmin: user.isAdmin || false,
        isGovernmentAuthorized: user.isGovernmentAuthorized || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    res.json({
      success: true,
      users: usersWithRoles,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

