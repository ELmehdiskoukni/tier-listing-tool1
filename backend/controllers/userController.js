import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.getAll();
  
  res.json({
    success: true,
    data: users
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.getById(id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Create new user
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Name, email, and password are required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }
  
  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }
  
  // Validate role
  if (role && !['Member', 'Admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Role must be either "Member" or "Admin"'
    });
  }
  
  const newUser = await User.create({
    name,
    email,
    password,
    role: role || 'Member'
  });
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  
  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
  }
  
  // Validate password length if provided
  if (password && password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }
  
  // Validate role if provided
  if (role && !['Member', 'Admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Role must be either "Member" or "Admin"'
    });
  }
  
  const updatedUser = await User.update(id, {
    name,
    email,
    password,
    role
  });
  
  res.json({
    success: true,
    data: updatedUser
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await User.delete(id);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Get user stats
export const getUserStats = asyncHandler(async (req, res) => {
  const users = await User.getAll();
  
  const stats = {
    total: users.length,
    byRole: {
      Admin: users.filter(user => user.role === 'Admin').length,
      Member: users.filter(user => user.role === 'Member').length
    }
  };
  
  res.json({
    success: true,
    data: stats
  });
});
