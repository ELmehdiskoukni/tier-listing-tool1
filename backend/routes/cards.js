import express from 'express';
import {
  getAllCards,
  getCardById,
  getCardsByTierId,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  duplicateCard,
  bulkCreateCards,
  bulkDeleteCards,
  toggleCardHidden,
  getCardStats
} from '../controllers/cardController.js';
import { validateCard, validateCardUpdate, validateId, validateMoveCard, validateBulkOperation } from '../middleware/validation.js';
import { authenticateToken, requireMemberOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Card routes
router.get('/', authenticateToken, getAllCards); // Protected route with role-based filtering
router.get('/stats', getCardStats);
router.get('/:id', validateId, getCardById);
router.get('/tier/:tierId', validateId, getCardsByTierId);
router.post('/', validateCard, createCard);
router.put('/:id', validateId, validateCardUpdate, updateCard);
router.delete('/:id', validateId, deleteCard);
router.patch('/:id/move', validateId, validateMoveCard, moveCard);
router.post('/:id/duplicate', validateId, duplicateCard);
router.post('/bulk', validateBulkOperation, bulkCreateCards);
router.delete('/bulk', bulkDeleteCards);
router.patch('/:id/toggle-hidden', validateId, toggleCardHidden);

export default router; 