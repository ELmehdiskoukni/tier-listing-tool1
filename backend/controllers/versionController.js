import { Version } from '../models/Version.js';
import { Tier } from '../models/Tier.js';
import { SourceCard } from '../models/SourceCard.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get all versions
export const getAllVersions = asyncHandler(async (req, res) => {
  const versions = await Version.getAll();
  
  res.json({
    success: true,
    data: versions
  });
});

// Get recent versions
export const getRecentVersions = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const versions = await Version.getRecent(parseInt(limit));
  
  res.json({
    success: true,
    data: versions
  });
});

// Get version by ID
export const getVersionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const version = await Version.getById(id);
  
  if (!version) {
    return res.status(404).json({
      success: false,
      error: 'Version not found'
    });
  }
  
  res.json({
    success: true,
    data: version
  });
});

// Create new version
export const createVersion = asyncHandler(async (req, res) => {
  const { description, tiersData, sourceCardsData } = req.body;
  
  // Generate unique ID
  const id = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const versionData = {
    id,
    description,
    tiersData: JSON.stringify(tiersData),
    sourceCardsData: JSON.stringify(sourceCardsData)
  };
  
  const newVersion = await Version.create(versionData);
  
  res.status(201).json({
    success: true,
    data: newVersion
  });
});

// Delete version
export const deleteVersion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await Version.delete(id);
  
  res.json({
    success: true,
    message: 'Version deleted successfully'
  });
});

// Restore to version
export const restoreToVersion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const restoredVersion = await Version.restoreToVersion(id);
  
  res.json({
    success: true,
    message: 'Successfully restored to version',
    data: restoredVersion
  });
});

// Get version statistics
export const getVersionStats = asyncHandler(async (req, res) => {
  const stats = await Version.getStats();
  
  res.json({
    success: true,
    data: stats
  });
});

// Search versions
export const searchVersions = asyncHandler(async (req, res) => {
  const { query, limit = 50 } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }
  
  const versions = await Version.search(query, parseInt(limit));
  
  res.json({
    success: true,
    data: versions
  });
});

// Get versions by date range
export const getVersionsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required'
    });
  }
  
  const versions = await Version.getByDateRange(startDate, endDate);
  
  res.json({
    success: true,
    data: versions
  });
});

// Get latest version
export const getLatestVersion = asyncHandler(async (req, res) => {
  const version = await Version.getLatest();
  
  if (!version) {
    return res.status(404).json({
      success: false,
      error: 'No versions found'
    });
  }
  
  res.json({
    success: true,
    data: version
  });
});

// Cleanup old versions
export const cleanupOldVersions = asyncHandler(async (req, res) => {
  const { keepCount = 20 } = req.query;
  
  const deletedVersions = await Version.cleanupOldVersions(parseInt(keepCount));
  
  res.json({
    success: true,
    message: `Cleaned up ${deletedVersions.length} old versions`,
    data: deletedVersions
  });
});

// Create version from current state
export const createVersionFromCurrentState = asyncHandler(async (req, res) => {
  const { description } = req.body;
  
  if (!description) {
    return res.status(400).json({
      success: false,
      error: 'Description is required'
    });
  }
  
  // Get current state
  const tiers = await Tier.getAllWithCards();
  const sourceCards = await SourceCard.getAllGroupedByCategory();
  
  // Generate unique ID
  const id = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const versionData = {
    id,
    description,
    tiersData: tiers,
    sourceCardsData: sourceCards
  };
  
  const newVersion = await Version.create(versionData);
  
  res.status(201).json({
    success: true,
    data: newVersion
  });
});

// Compare versions
export const compareVersions = asyncHandler(async (req, res) => {
  const { version1Id, version2Id } = req.params;
  
  const version1 = await Version.getById(version1Id);
  const version2 = await Version.getById(version2Id);
  
  if (!version1 || !version2) {
    return res.status(404).json({
      success: false,
      error: 'One or both versions not found'
    });
  }
  
  // Simple comparison - count differences
  const comparison = {
    version1: {
      id: version1.id,
      description: version1.description,
      createdAt: version1.created_at,
      tierCount: version1.tiersData ? version1.tiersData.length : 0,
      totalCardCount: version1.tiersData ? version1.tiersData.reduce((total, tier) => total + (tier.cards ? tier.cards.length : 0), 0) : 0,
      sourceCardCount: version1.sourceCardsData ? Object.values(version1.sourceCardsData).reduce((total, cards) => total + cards.length, 0) : 0
    },
    version2: {
      id: version2.id,
      description: version2.description,
      createdAt: version2.created_at,
      tierCount: version2.tiersData ? version2.tiersData.length : 0,
      totalCardCount: version2.tiersData ? version2.tiersData.reduce((total, tier) => total + (tier.cards ? tier.cards.length : 0), 0) : 0,
      sourceCardCount: version2.sourceCardsData ? Object.values(version2.sourceCardsData).reduce((total, cards) => total + cards.length, 0) : 0
    }
  };
  
  res.json({
    success: true,
    data: comparison
  });
}); 