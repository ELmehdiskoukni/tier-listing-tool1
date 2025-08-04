import express from 'express';
import {
  getAllTiers,
  getAllTiersWithCards,
  getTierById,
  getTierWithCards,
  createTier,
  updateTier,
  deleteTier,
  moveTierPosition,
  duplicateTier,
  getTierStats,
  clearTierCards
} from '../controllers/tierController.js';
import { validateTier, validateTierUpdate, validateId, validateTierMovement } from '../middleware/validation.js';

const router = express.Router();

// GET /api/tiers - Get all tiers
router.get('/', getAllTiers);

// GET /api/tiers/with-cards - Get all tiers with cards
router.get('/with-cards', getAllTiersWithCards);

// GET /api/tiers/stats - Get tier statistics
router.get('/stats', getTierStats);

// GET /api/tiers/:id - Get tier by ID
router.get('/:id', validateId, getTierById);

// GET /api/tiers/:id/with-cards - Get tier with cards
router.get('/:id/with-cards', validateId, getTierWithCards);

// POST /api/tiers - Create new tier
router.post('/', validateTier, createTier);

// PUT /api/tiers/:id - Update tier
router.put('/:id', validateId, validateTierUpdate, updateTier);

// DELETE /api/tiers/:id - Delete tier
router.delete('/:id', validateId, deleteTier);

// POST /api/tiers/:id/move - Move tier position
router.post('/:id/move', validateId, validateTierMovement, moveTierPosition);

// POST /api/tiers/:id/duplicate - Duplicate tier
router.post('/:id/duplicate', validateId, duplicateTier);

// POST /api/tiers/:id/clear - Clear all cards from tier
router.post('/:id/clear', validateId, clearTierCards);

export default router; 