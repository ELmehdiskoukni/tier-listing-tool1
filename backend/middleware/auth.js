import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Simple auth middleware for this demo app
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    // For this demo, we're using a simple base64 encoded token
    // In production, use proper JWT verification
    try {
      const decoded = atob(token); // Decode base64
      const [userId, timestamp] = decoded.split(':');
      
      if (!userId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid token format' 
        });
      }

      // Get user from database
      const user = await User.getById(userId);
      if (!user) {
        return res.status(403).json({ 
          success: false, 
          error: 'User not found' 
        });
      }


      // Add user info to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

// Role-based access control
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

export const requireMemberOrAdmin = (req, res, next) => {
  if (!req.user || !['Admin', 'Member'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Member or Admin access required'
    });
  }
  next();
};
