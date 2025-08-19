import express from 'express';
import {
  getAllSourceCards,
  getAllSourceCardsGrouped,
  getSourceCardsByCategory,
  getSourceCardById,
  createSourceCard,
  updateSourceCard,
  deleteSourceCard,
  duplicateSourceCard,
  searchSourceCards,
  getSourceCardStats,
  bulkCreateSourceCards,
  bulkDeleteSourceCards,
  importCardsToTier
} from '../controllers/sourceCardController.js';
import {
  getSourceCommentsByCardId,
  createSourceComment,
  deleteSourceComment
} from '../controllers/sourceCardController.js';
import { toggleSourceInstancesHidden } from '../controllers/sourceCardController.js';
import { validateSourceCard, validateSourceCardUpdate, validateId, validateBulkOperation, validateComment, validateCommentId } from '../middleware/validation.js';

const router = express.Router();

// GET /api/source-cards - Get all source cards
router.get('/', getAllSourceCards);

// GET /api/source-cards/grouped - Get all source cards grouped by category
router.get('/grouped', getAllSourceCardsGrouped);

// GET /api/source-cards/stats - Get source card statistics
router.get('/stats', getSourceCardStats);

// GET /api/source-cards/search - Search source cards
router.get('/search', searchSourceCards);

// GET /api/source-cards/category/:category - Get source cards by category
router.get('/category/:category', getSourceCardsByCategory);

// GET /api/source-cards/:id - Get source card by ID
router.get('/:id', validateId, getSourceCardById);

// POST /api/source-cards - Create new source card
router.post('/', validateSourceCard, createSourceCard);

// PUT /api/source-cards/:id - Update source card
router.put('/:id', validateId, validateSourceCardUpdate, updateSourceCard);

// DELETE /api/source-cards/:id - Delete source card
router.delete('/:id', validateId, deleteSourceCard);

// POST /api/source-cards/:id/duplicate - Duplicate source card
router.post('/:id/duplicate', validateId, duplicateSourceCard);

// POST /api/source-cards/bulk-create - Bulk create source cards
router.post('/bulk-create', bulkCreateSourceCards);

// DELETE /api/source-cards/bulk-delete - Bulk delete source cards
router.delete('/bulk-delete', validateBulkOperation, bulkDeleteSourceCards);

// POST /api/source-cards/import - Import cards from source to tier
router.post('/import', importCardsToTier);

// Source card comments endpoints
// GET /api/source-cards/:id/comments - Get comments for a source card
router.get('/:id/comments', validateId, getSourceCommentsByCardId);
// POST /api/source-cards/:id/comments - Add comment to a source card
router.post('/:id/comments', validateId, validateComment, createSourceComment);
// DELETE /api/source-cards/:id/comments/:commentId - Delete a source card comment
router.delete('/:id/comments/:commentId', validateId, validateCommentId, deleteSourceComment);

// POST /api/source-cards/:id/toggle-hidden - Toggle hidden for all tier instances referencing this source card
router.post('/:id/toggle-hidden', validateId, toggleSourceInstancesHidden);

export default router; 