import express from 'express';
import {
  getAllComments,
  getCommentById,
  getCommentsByCardId,
  createComment,
  updateComment,
  deleteComment,
  getRecentComments,
  searchComments,
  getCommentCount,
  bulkCreateComments,
  bulkDeleteComments,
  deleteCommentsByCardId
} from '../controllers/commentController.js';
import { validateComment, validateId, validateBulkOperation } from '../middleware/validation.js';

const router = express.Router();

// GET /api/comments - Get all comments
router.get('/', getAllComments);

// GET /api/comments/recent - Get recent comments
router.get('/recent', getRecentComments);

// GET /api/comments/search - Search comments
router.get('/search', searchComments);

// GET /api/comments/:id - Get comment by ID
router.get('/:id', validateId, getCommentById);

// GET /api/comments/card/:cardId - Get comments by card ID
router.get('/card/:cardId', validateId, getCommentsByCardId);

// GET /api/comments/card/:cardId/count - Get comment count for card
router.get('/card/:cardId/count', validateId, getCommentCount);

// POST /api/comments - Create new comment
router.post('/', validateComment, createComment);

// PUT /api/comments/:id - Update comment
router.put('/:id', validateId, validateComment, updateComment);

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', validateId, deleteComment);

// DELETE /api/comments/card/:cardId - Delete all comments for card
router.delete('/card/:cardId', validateId, deleteCommentsByCardId);

// POST /api/comments/bulk-create - Bulk create comments
router.post('/bulk-create', bulkCreateComments);

// DELETE /api/comments/bulk-delete - Bulk delete comments
router.delete('/bulk-delete', validateBulkOperation, bulkDeleteComments);

export default router; 