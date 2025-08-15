import { Card } from '../models/Card.js';
import { Tier } from '../models/Tier.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get all cards
export const getAllCards = asyncHandler(async (req, res) => {
  const cards = await Card.getAll();
  
  res.json({
    success: true,
    data: cards
  });
});

// Get card by ID
export const getCardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const card = await Card.getById(id);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }
  
  res.json({
    success: true,
    data: card
  });
});

// Get card with comments
export const getCardWithComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const card = await Card.getWithComments(id);
  
  res.json({
    success: true,
    data: card
  });
});

// Get cards by tier ID
export const getCardsByTierId = asyncHandler(async (req, res) => {
  const { tierId } = req.params;
  
  // Check if tier exists
  const tier = await Tier.getById(tierId);
  if (!tier) {
    return res.status(404).json({
      success: false,
      error: 'Tier not found'
    });
  }
  
  const cards = await Card.getByTierId(tierId);
  
  res.json({
    success: true,
    data: cards
  });
});

// Create new card
export const createCard = asyncHandler(async (req, res) => {
  const { text, type, subtype, imageUrl, hidden, tierId, position } = req.body;
  
  // Check if tier exists
  const tier = await Tier.getById(tierId);
  if (!tier) {
    return res.status(404).json({
      success: false,
      error: 'Tier not found'
    });
  }
  
  // Generate unique ID
  const id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // If position not provided, get next available position in tier
  const cardPosition = position !== undefined && position !== null ? parseInt(position) : await Card.getNextPositionInTier(tierId);
  
  const cardData = {
    id,
    text,
    type,
    subtype,
    imageUrl,
    hidden: hidden || false,
    tierId,
    position: cardPosition
  };
  
  const newCard = await Card.create(cardData);
  
  res.status(201).json({
    success: true,
    data: newCard
  });
});

// Update card
export const updateCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const updatedCard = await Card.update(id, updateData);
  
  res.json({
    success: true,
    data: updatedCard
  });
});

// Delete card
export const deleteCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await Card.delete(id);
  
  res.json({
    success: true,
    message: 'Card deleted successfully'
  });
});

// Move card to different tier
export const moveCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { targetTierId, position } = req.body;

  if (!targetTierId) {
    return res.status(400).json({ success: false, error: 'Target tier ID is required' });
  }

  // Validate destination tier
  const targetTier = await Tier.getById(targetTierId);
  if (!targetTier) {
    return res.status(404).json({ success: false, error: 'Target tier not found' });
  }

  // If position not provided, compute next available position
  const cardPosition = position !== undefined && position !== null
    ? parseInt(position)
    : await Card.getNextPositionInTier(targetTierId);

  // Move the card
  await Card.moveToTier(id, targetTierId, cardPosition);

  // Return full, normalized tiers with cards so frontend can set state safely
  const tiersWithCards = await Tier.getAllWithCards();
  return res.json({ success: true, data: tiersWithCards });
});

// Duplicate card
export const duplicateCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('🔍 Backend: duplicateCard called with id:', id)
  
  const originalCard = await Card.getById(id);
  if (!originalCard) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }
  
  console.log('🔍 Backend: originalCard:', originalCard)
  
  // Handle both field name variations (tierId vs tierid)
  const tierId = originalCard.tierId || originalCard.tierid;
  console.log('🔍 Backend: tierId (resolved):', tierId)
  
  // Check if the card has a tierId
  if (!tierId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot duplicate a card that is not in a tier'
    });
  }
  
  // Generate new card ID
  const newCardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Get next position in the same tier
  const newPosition = await Card.getNextPositionInTier(tierId);
  
  console.log('🔍 Backend: newPosition:', newPosition)
  
  const newCardData = {
    id: newCardId,
    text: originalCard.text,
    type: originalCard.type,
    subtype: originalCard.subtype,
    imageUrl: originalCard.imageUrl || originalCard.imageurl,
    hidden: originalCard.hidden || false,
    tierId: tierId,
    position: newPosition
  };
  
  console.log('🔍 Backend: newCardData:', newCardData)
  
  const newCard = await Card.create(newCardData);
  
  res.status(201).json({
    success: true,
    data: newCard
  });
});

// Toggle card hidden status
export const toggleCardHidden = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const card = await Card.getById(id);
  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }
  
  const updatedCard = await Card.update(id, { hidden: !card.hidden });
  
  res.json({
    success: true,
    data: updatedCard
  });
});

// Bulk create cards
export const bulkCreateCards = asyncHandler(async (req, res) => {
  const { cards } = req.body;
  
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Cards array is required and must not be empty'
    });
  }
  
  // Validate all cards have required tierId
  for (const card of cards) {
    if (!card.tierId) {
      return res.status(400).json({
        success: false,
        error: 'All cards must have a tierId'
      });
    }
    
    // Check if tier exists
    const tier = await Tier.getById(card.tierId);
    if (!tier) {
      return res.status(404).json({
        success: false,
        error: `Tier with ID ${card.tierId} not found`
      });
    }
  }
  
  // Generate IDs and positions for cards
  const cardsToCreate = await Promise.all(cards.map(async (card, index) => {
    const id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const position = card.position !== undefined ? card.position : await Card.getNextPositionInTier(card.tierId);
    
    return {
      id,
      text: card.text,
      type: card.type,
      subtype: card.subtype,
      imageUrl: card.imageUrl,
      hidden: card.hidden || false,
      tierId: card.tierId,
      position
    };
  }));
  
  const createdCards = await Card.bulkCreate(cardsToCreate);
  
  res.status(201).json({
    success: true,
    data: createdCards
  });
});

// Bulk delete cards
export const bulkDeleteCards = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Card IDs array is required and must not be empty'
    });
  }
  
  const deletedCards = await Card.bulkDelete(ids);
  
  res.json({
    success: true,
    message: `Deleted ${deletedCards.length} cards`,
    data: deletedCards
  });
});

// Search cards
export const searchCards = asyncHandler(async (req, res) => {
  const { query, tierId, type } = req.query;
  
  let cards = await Card.getAll();
  
  // Filter by search query
  if (query) {
    cards = cards.filter(card => 
      card.text.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Filter by tier ID
  if (tierId) {
    cards = cards.filter(card => card.tierId === tierId);
  }
  
  // Filter by type
  if (type) {
    cards = cards.filter(card => card.type === type);
  }
  
  res.json({
    success: true,
    data: cards
  });
});

// Get card statistics
export const getCardStats = asyncHandler(async (req, res) => {
  const cards = await Card.getAll();
  
  const stats = {
    total: cards.length,
    byType: {},
    byTier: {},
    hidden: cards.filter(card => card.hidden).length,
    withImages: cards.filter(card => card.imageUrl).length
  };
  
  // Count by type
  cards.forEach(card => {
    stats.byType[card.type] = (stats.byType[card.type] || 0) + 1;
  });
  
  // Count by tier
  cards.forEach(card => {
    stats.byTier[card.tierId] = (stats.byTier[card.tierId] || 0) + 1;
  });
  
  res.json({
    success: true,
    data: stats
  });
}); 