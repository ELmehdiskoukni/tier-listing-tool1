import { SourceCard } from '../models/SourceCard.js';
import { Card } from '../models/Card.js';
import { Tier } from '../models/Tier.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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
  
  const updatedSourceCard = await SourceCard.update(id, updateData);
  
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