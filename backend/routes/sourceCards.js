import express from 'express';
import {
  getAllSourceCards,
  getAllSourceCardsGrouped,
  getSourceCardsByCategory,
  getSourceCardById,
  createSourceCard,
  updateSourceCard,
  deleteSourceCard,
  searchSourceCards,
  getSourceCardStats,
  bulkCreateSourceCards,
  bulkDeleteSourceCards,
  importCardsToTier
} from '../controllers/sourceCardController.js';
import { validateSourceCard, validateId, validateBulkOperation } from '../middleware/validation.js';

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
router.put('/:id', validateId, validateSourceCard, updateSourceCard);

// DELETE /api/source-cards/:id - Delete source card
router.delete('/:id', validateId, deleteSourceCard);

// POST /api/source-cards/bulk-create - Bulk create source cards
router.post('/bulk-create', bulkCreateSourceCards);

// DELETE /api/source-cards/bulk-delete - Bulk delete source cards
router.delete('/bulk-delete', validateBulkOperation, bulkDeleteSourceCards);

// POST /api/source-cards/import - Import cards from source to tier
router.post('/import', importCardsToTier);

export default router; 