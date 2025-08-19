import { SourceCard } from '../models/SourceCard.js';
import { Card } from '../models/Card.js';
import { Tier } from '../models/Tier.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { pool } from '../config/database.js';

// Get all source cards
export const getAllSourceCards = asyncHandler(async (req, res) => {
  const sourceCards = await SourceCard.getAll();
  
  res.json({
    success: true,
    data: sourceCards
  });
});

// Get all source cards grouped by category
export const getAllSourceCardsGrouped = asyncHandler(async (req, res) => {
  const sourceCards = await SourceCard.getAllGroupedByCategory();
  
  res.json({
    success: true,
    data: sourceCards
  });
});

// Get source cards by category
export const getSourceCardsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  
  const sourceCards = await SourceCard.getByCategory(category);
  
  res.json({
    success: true,
    data: sourceCards
  });
});

// Get source card by ID
export const getSourceCardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sourceCard = await SourceCard.getById(id);
  
  if (!sourceCard) {
    return res.status(404).json({
      success: false,
      error: 'Source card not found'
    });
  }
  
  res.json({
    success: true,
    data: sourceCard
  });
});

// Create new source card
export const createSourceCard = asyncHandler(async (req, res) => {
  const { text, type, subtype, sourceCategory, imageUrl } = req.body;
  
  // Generate unique ID
  const id = `source-${sourceCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const cardData = {
    id,
    text,
    type,
    subtype,
    sourceCategory,
    imageUrl
  };
  
  const newSourceCard = await SourceCard.create(cardData);
  
  res.status(201).json({
    success: true,
    data: newSourceCard
  });
});

// Update source card
export const updateSourceCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Fetch original to know prior text/type for propagating to tier cards
  const original = await SourceCard.getById(id);
  if (!original) {
    return res.status(404).json({ success: false, error: 'Source card not found' });
  }

  // Update the source card first
  const updatedSourceCard = await SourceCard.update(id, updateData);

  // Propagate name (and image if explicitly changed) to tier card instances created from this source card.
  // Since we don't persist a source_card_id on tier cards, match by prior text + type.
  try {
    if (Object.prototype.hasOwnProperty.call(updateData, 'imageUrl')) {
      // Image explicitly provided: update both text and image
      await pool.query(
        `UPDATE cards
           SET text = $1,
               image_url = $2,
               updated_at = CURRENT_TIMESTAMP
         WHERE text = $3
           AND type = $4`,
        [
          updatedSourceCard.text,
          updatedSourceCard.imageUrl, // may be null intentionally if clearing image
          original.text,
          original.type
        ]
      );
    } else {
      // Only rename: update text, preserve existing image_url
      await pool.query(
        `UPDATE cards
           SET text = $1,
               updated_at = CURRENT_TIMESTAMP
         WHERE text = $2
           AND type = $3`,
        [
          updatedSourceCard.text,
          original.text,
          original.type
        ]
      );
    }
  } catch (e) {
    // Log and continue; do not fail the source update response
    console.error('Failed to propagate source card changes to tier cards:', e);
  }

  res.json({
    success: true,
    data: updatedSourceCard
  });
});

// Delete source card
export const deleteSourceCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await SourceCard.delete(id);
  
  res.json({
    success: true,
    message: 'Source card deleted successfully',
    data: result
  });
});

// Duplicate source card
export const duplicateSourceCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('🔍 Backend: duplicateSourceCard called with id:', id);
  
  // Get the original source card with comments
  const originalCard = await SourceCard.getWithComments(id);
  if (!originalCard) {
    return res.status(404).json({
      success: false,
      error: 'Source card not found'
    });
  }
  
  console.log('🔍 Backend: originalCard with comments:', originalCard);
  
  // Generate new source card ID
  const newCardId = `source-${originalCard.sourceCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const newCardData = {
    id: newCardId,
    text: originalCard.text + ' copy',
    type: originalCard.type,
    subtype: originalCard.subtype,
    sourceCategory: originalCard.sourceCategory,
    imageUrl: originalCard.imageUrl || originalCard.imageurl
  };
  
  console.log('🔍 Backend: newCardData:', newCardData);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create the new source card
    await client.query(
      `INSERT INTO source_cards (card_id, text, type, subtype, source_category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newCardId, newCardData.text, newCardData.type, newCardData.subtype, 
       newCardData.sourceCategory, newCardData.imageUrl]
    );
    
    // Clone all comments
    if (originalCard.comments && originalCard.comments.length > 0) {
      for (const comment of originalCard.comments) {
        const newCommentId = `source-comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Preserve original comment timestamp for historical accuracy
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
            `INSERT INTO source_comments (comment_id, text, source_card_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $4)`,
            [newCommentId, comment.text, newCardId, originalTimestamp]
          );
        } else {
          // Fall back to current timestamp
          await client.query(
            `INSERT INTO source_comments (comment_id, text, source_card_id)
             VALUES ($1, $2, $3)`,
            [newCommentId, comment.text, newCardId]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Fetch the newly created source card with its comments
    const newCardWithComments = await SourceCard.getWithComments(newCardId);
    
    res.status(201).json({
      success: true,
      data: newCardWithComments
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in duplicateSourceCard:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Comments on source cards
export const getSourceCommentsByCardId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const card = await SourceCard.getById(id);
  if (!card) {
    return res.status(404).json({ success: false, error: 'Source card not found' });
  }
  const result = await pool.query(
    `SELECT comment_id as id, text, source_card_id as sourceCardId, created_at, updated_at FROM source_comments WHERE source_card_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  res.json({ success: true, data: result.rows });
});

export const createSourceComment = asyncHandler(async (req, res) => {
  const { id } = req.params; // source card id
  const { text } = req.body;
  const card = await SourceCard.getById(id);
  if (!card) {
    return res.status(404).json({ success: false, error: 'Source card not found' });
  }
  const commentId = `source-comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const result = await pool.query(
    `INSERT INTO source_comments (comment_id, text, source_card_id) VALUES ($1, $2, $3) RETURNING comment_id as id, text, source_card_id as sourceCardId, created_at, updated_at`,
    [commentId, text, id]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const deleteSourceComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await pool.query(`DELETE FROM source_comments WHERE comment_id = $1 RETURNING comment_id`, [commentId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Comment not found' });
  }
  res.json({ success: true, message: 'Comment deleted successfully' });
});

// Toggle hidden flag for all tier card instances that reference a source card
export const toggleSourceInstancesHidden = asyncHandler(async (req, res) => {
  const { id } = req.params; // source card id

  // Ensure source card exists
  const sourceCard = await SourceCard.getById(id);
  if (!sourceCard) {
    return res.status(404).json({ success: false, error: 'Source card not found' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Determine current hidden state across all matching tier cards
    const statsResult = await client.query(
      `SELECT COUNT(*)::int as total,
              COALESCE(SUM(CASE WHEN hidden THEN 1 ELSE 0 END), 0)::int as hidden_count
         FROM cards
        WHERE text = $1 AND type = $2`,
      [sourceCard.text, sourceCard.type]
    );

    const total = statsResult.rows[0]?.total || 0;
    const hiddenCount = statsResult.rows[0]?.hidden_count || 0;
    const shouldHide = hiddenCount < total; // if any visible, hide all; else show all

    // Update tier card instances
    await client.query(
      `UPDATE cards SET hidden = $1, updated_at = CURRENT_TIMESTAMP WHERE text = $2 AND type = $3`,
      [shouldHide, sourceCard.text, sourceCard.type]
    );

    // Reflect hidden state on the source card itself for UI styling
    await client.query(
      `UPDATE source_cards SET hidden = $1, updated_at = CURRENT_TIMESTAMP WHERE card_id = $2`,
      [shouldHide, id]
    );

    await client.query('COMMIT');

    // Return updated tiers so frontend can refresh board
    const updatedTiers = await Tier.getAllWithCards();
    res.json({ success: true, data: updatedTiers });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Search source cards
export const searchSourceCards = asyncHandler(async (req, res) => {
  const { query, category } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }
  
  const sourceCards = await SourceCard.search(query, category);
  
  res.json({
    success: true,
    data: sourceCards
  });
});

// Get source card statistics
export const getSourceCardStats = asyncHandler(async (req, res) => {
  const stats = await SourceCard.getStats();
  
  res.json({
    success: true,
    data: stats
  });
});

// Bulk create source cards
export const bulkCreateSourceCards = asyncHandler(async (req, res) => {
  const { cards } = req.body;
  
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Cards array is required and must not be empty'
    });
  }
  
  // Validate all cards have required fields
  for (const card of cards) {
    if (!card.text || !card.type || !card.sourceCategory) {
      return res.status(400).json({
        success: false,
        error: 'All cards must have text, type, and sourceCategory'
      });
    }
  }
  
  // Generate IDs for cards
  const cardsToCreate = cards.map(card => {
    const id = `source-${card.sourceCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      text: card.text,
      type: card.type,
      subtype: card.subtype,
      sourceCategory: card.sourceCategory,
      imageUrl: card.imageUrl
    };
  });
  
  const createdCards = await SourceCard.bulkCreate(cardsToCreate);
  
  res.status(201).json({
    success: true,
    data: createdCards
  });
});

// Bulk delete source cards
export const bulkDeleteSourceCards = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Source card IDs array is required and must not be empty'
    });
  }
  
  const deletedCards = await SourceCard.bulkDelete(ids);
  
  res.json({
    success: true,
    message: `Deleted ${deletedCards.length} source cards`,
    data: deletedCards
  });
});

// Import cards from source to tier
export const importCardsToTier = asyncHandler(async (req, res) => {
  const { tierId, sourceCardIds } = req.body;
  
  if (!tierId || !Array.isArray(sourceCardIds) || sourceCardIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Tier ID and source card IDs array are required'
    });
  }
  
  // Verify the tier exists
  const tier = await Tier.getById(tierId);
  if (!tier) {
    return res.status(404).json({
      success: false,
      error: `Tier with ID ${tierId} not found`
    });
  }
  
  // Get source cards
  const sourceCards = [];
  for (const sourceCardId of sourceCardIds) {
    const sourceCard = await SourceCard.getById(sourceCardId);
    if (!sourceCard) {
      return res.status(404).json({
        success: false,
        error: `Source card with ID ${sourceCardId} not found`
      });
    }
    sourceCards.push(sourceCard);
  }
  
  // Import source cards to the tier as regular cards
  const importedCards = [];
  for (const sourceCard of sourceCards) {
    // Generate a new card ID for the imported card
    const cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get the next position in the tier
    const position = await Card.getNextPositionInTier(tierId);
    
    // Create the card in the tier
    const importedCard = await Card.create({
      id: cardId,
      text: sourceCard.text,
      type: sourceCard.type,
      subtype: sourceCard.subtype,
      imageUrl: sourceCard.imageUrl,
      hidden: false,
      tierId: tierId,
      position: position
    });
    
    // Clone comments from the source card into the new tier card
    if (sourceCard.comments && sourceCard.comments.length > 0) {
      for (const srcComment of sourceCard.comments) {
        const newCommentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Attempt to preserve original comment timestamp if available
        let originalTimestamp = null;
        try {
          if (srcComment.createdAt) {
            originalTimestamp = new Date(srcComment.createdAt);
          }
        } catch (e) {
          // If parsing fails, fall back to default timestamps
        }
        
        if (originalTimestamp && !isNaN(originalTimestamp.getTime())) {
          await pool.query(
            `INSERT INTO comments (comment_id, text, card_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $4)`,
            [newCommentId, srcComment.text, cardId, originalTimestamp]
          );
        } else {
          await pool.query(
            `INSERT INTO comments (comment_id, text, card_id)
             VALUES ($1, $2, $3)`,
            [newCommentId, srcComment.text, cardId]
          );
        }
      }
    }
    
    importedCards.push(importedCard);
  }
  
  // Get the updated tiers with all cards
  const updatedTiers = await Tier.getAllWithCards();
  
  res.json({
    success: true,
    message: `Successfully imported ${importedCards.length} cards to tier`,
    data: updatedTiers
  });
}); 