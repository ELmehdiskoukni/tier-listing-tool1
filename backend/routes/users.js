import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} from '../controllers/userController.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', getAllUsers);

// GET /api/users/stats - Get user statistics
router.get('/stats', getUserStats);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create new user
router.post('/', createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

export default router;
