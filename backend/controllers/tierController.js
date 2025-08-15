import { Tier } from '../models/Tier.js';
import { Card } from '../models/Card.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { pool } from '../config/database.js'; // Fixed import path

// Get all tiers
export const getAllTiers = asyncHandler(async (req, res) => {
  const tiers = await Tier.getAll();
  
  res.json({
    success: true,
    data: tiers
  });
});

// Get all tiers with cards
export const getAllTiersWithCards = asyncHandler(async (req, res) => {
  const tiers = await Tier.getAllWithCards();
  
  res.json({
    success: true,
    data: tiers
  });
});

// Get tier by ID
export const getTierById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tier = await Tier.getById(id);
  
  if (!tier) {
    return res.status(404).json({
      success: false,
      error: 'Tier not found'
    });
  }
  
  res.json({
    success: true,
    data: tier
  });
});

// Get tier with cards
export const getTierWithCards = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tier = await Tier.getWithCards(id);
  
  res.json({
    success: true,
    data: tier
  });
});

// Create new tier
export const createTier = asyncHandler(async (req, res) => {
  const { name, color, position } = req.body;
  
  // Generate unique ID
  const id = `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // If position not provided, get next available position
  let tierPosition = position !== undefined ? position : await Tier.getNextPosition();
  
  // If position is provided, we need to shift existing tiers to make room
  if (position !== undefined) {
    // Check if there's already a tier at this position
    const existingTierAtPosition = await pool.query(
      'SELECT tier_id FROM tiers WHERE position = $1',
      [position]
    );
    
    if (existingTierAtPosition.rows.length > 0) {
      // Shift all tiers at this position and beyond up by 1
      await pool.query(
        'UPDATE tiers SET position = position + 1, updated_at = CURRENT_TIMESTAMP WHERE position >= $1',
        [position]
      );
    }
  }
  
  const tierData = {
    id,
    name,
    color: color || 'bg-blue-200',
    position: tierPosition
  };
  
  const newTier = await Tier.create(tierData);
  
  res.status(201).json({
    success: true,
    data: newTier
  });
});

// Update tier
export const updateTier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  console.log('🔍 Backend: updateTier received id:', id)
  console.log('🔍 Backend: updateTier received updateData:', updateData)
  console.log('🔍 Backend: updateTier received req.body:', req.body)
  console.log('🔍 Backend: updateTier received req.params:', req.params)
  
  const updatedTier = await Tier.update(id, updateData);
  
  console.log('🔍 Backend: updateTier result:', updatedTier)
  
  res.json({
    success: true,
    data: updatedTier
  });
});

// Delete tier
export const deleteTier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if tier has cards
  const cards = await Card.getByTierId(id);
  if (cards.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete tier with cards. Please move or delete all cards first.'
    });
  }

  // Check if deleting this tier would result in fewer than 2 tiers
  const allTiers = await Tier.getAll();
  if (allTiers.length <= 2) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete tier. Your Tier Listing board must have at least 2 tiers.'
    });
  }
  
  await Tier.delete(id);
  
  res.json({
    success: true,
    message: 'Tier deleted successfully'
  });
});

// Move tier position
export const moveTierPosition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { direction } = req.body;
  
  if (!direction || !['up', 'down'].includes(direction)) {
    return res.status(400).json({
      success: false,
      error: 'Valid direction (up or down) is required'
    });
  }
  
  await Tier.moveByDirection(id, direction);
  
  // Return all tiers with cards after the move operation
  const allTiers = await Tier.getAllWithCards();
  
  res.json({
    success: true,
    data: allTiers
  });
});

// Duplicate tier
// Fixed duplicateTier function in backend/controllers/tierController.js
// Improved duplicateTier function with timestamp preservation
export const duplicateTier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const originalTier = await Tier.getWithCards(id);
  if (!originalTier) {
    return res.status(404).json({
      success: false,
      error: 'Tier not found'
    });
  }
  
  // Generate new tier ID and name
  const newTierId = `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newTierName = `${originalTier.name} Copy`;
  const newTierPosition = await Tier.getNextPosition();
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create new tier
    await client.query(
      `INSERT INTO tiers (tier_id, name, color, position) 
       VALUES ($1, $2, $3, $4)`,
      [newTierId, newTierName, originalTier.color, newTierPosition]
    );
    
    // Duplicate cards if any
    if (originalTier.cards && originalTier.cards.length > 0) {
      for (const card of originalTier.cards) {
        // Create new card ID with a unique timestamp to avoid collisions
        const newCardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert the duplicate card
        await client.query(
          `INSERT INTO cards (card_id, text, type, subtype, image_url, hidden, tier_id, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [newCardId, card.text, card.type, card.subtype, card.imageUrl, 
           card.hidden || false, newTierId, card.position]
        );
        
        // If the original card has comments, duplicate them too
        if (card.comments && card.comments.length > 0) {
          for (const comment of card.comments) {
            // Create new comment ID
            const newCommentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Try to preserve original comment timestamp for historical accuracy
            let originalTimestamp = null;
            try {
              if (comment.createdAt) {
                originalTimestamp = new Date(comment.createdAt);
              }
            } catch (e) {
              console.error('Error parsing timestamp:', e);
            }
            
            if (originalTimestamp && !isNaN(originalTimestamp.getTime())) {
              // Use the timestamp from original comment
              await client.query(
                `INSERT INTO comments (comment_id, text, card_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $4)`,
                [newCommentId, comment.text, newCardId, originalTimestamp]
              );
            } else {
              // Fall back to current timestamp
              await client.query(
                `INSERT INTO comments (comment_id, text, card_id)
                 VALUES ($1, $2, $3)`,
                [newCommentId, comment.text, newCardId]
              );
            }
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Get the new tier with cards and comments
    const newTierWithCards = await Tier.getWithCards(newTierId);
    
    res.status(201).json({
      success: true,
      data: newTierWithCards
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in duplicateTier:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Get tier statistics
export const getTierStats = asyncHandler(async (req, res) => {
  const tiers = await Tier.getAllWithCards();
  
  const stats = tiers.map(tier => ({
    id: tier.id,
    name: tier.name,
    cardCount: tier.cards ? tier.cards.length : 0,
    hiddenCardCount: tier.cards ? tier.cards.filter(card => card.hidden).length : 0,
    commentCount: tier.cards ? tier.cards.reduce((total, card) => total + (card.comments ? card.comments.length : 0), 0) : 0
  }));
  
  res.json({
    success: true,
    data: stats
  });
});

// Clear all cards from tier
export const clearTierCards = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if tier exists
  const tier = await Tier.getById(id);
  if (!tier) {
    return res.status(404).json({
      success: false,
      error: 'Tier not found'
    });
  }
  
  // Get all cards in the tier
  const cards = await Card.getByTierId(id);
  
  if (cards.length === 0) {
    return res.json({
      success: true,
      message: 'Tier is already empty'
    });
  }
  
  // Delete all cards (comments will be cascade deleted)
  const cardIds = cards.map(card => card.id);
  await Card.bulkDelete(cardIds);
  
  res.json({
    success: true,
    message: `Cleared ${cards.length} cards from tier`,
    deletedCount: cards.length
  });
}); 