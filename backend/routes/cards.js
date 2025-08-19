import express from 'express';
import {
  getAllCards,
  getCardById,
  getCardWithComments,
  getCardsByTierId,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  duplicateCard,
  toggleCardHidden,
  bulkCreateCards,
  bulkDeleteCards,
  searchCards,
  getCardStats
} from '../controllers/cardController.js';
import { validateCard, validateCardUpdate, validateId, validateBulkOperation, validateMoveCard } from '../middleware/validation.js';

const router = express.Router();

// GET /api/cards - Get all cards
router.get('/', getAllCards);

// GET /api/cards/stats - Get card statistics
router.get('/stats', getCardStats);

// GET /api/cards/search - Search cards
router.get('/search', searchCards);

// GET /api/cards/:id - Get card by ID
router.get('/:id', validateId, getCardById);

// GET /api/cards/:id/with-comments - Get card with comments
router.get('/:id/with-comments', validateId, getCardWithComments);

// GET /api/cards/tier/:tierId - Get cards by tier ID
router.get('/tier/:tierId', validateId, getCardsByTierId);

// POST /api/cards - Create new card
router.post('/', validateCard, createCard);

// PUT /api/cards/:id - Update card
router.put('/:id', validateId, validateCardUpdate, updateCard);

// DELETE /api/cards/:id - Delete card
router.delete('/:id', validateId, deleteCard);

// POST /api/cards/:id/move - Move card to different tier
router.post('/:id/move', validateId, validateMoveCard, moveCard);

// POST /api/cards/:id/duplicate - Duplicate card
router.post('/:id/duplicate', validateId, duplicateCard);

// POST /api/cards/:id/toggle-hidden - Toggle card hidden status
router.post('/:id/toggle-hidden', validateId, toggleCardHidden);

// POST /api/cards/bulk-create - Bulk create cards
router.post('/bulk-create', bulkCreateCards);

// DELETE /api/cards/bulk-delete - Bulk delete cards
router.delete('/bulk-delete', validateBulkOperation, bulkDeleteCards);

export default router; 