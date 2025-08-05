import { useState, useEffect, useCallback } from 'react';
import { tierAPI, sourceCardAPI, cardAPI, commentAPI, versionAPI, handleAPIError } from '../api/apiClient';

export const useTierBoard = () => {
  // State for data
  const [tiers, setTiers] = useState([]);
  const [sourceCards, setSourceCards] = useState({
    competitors: [],
    pages: [],
    personas: []
  });
  const [versionHistory, setVersionHistory] = useState([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  // State for loading and errors
  const [loading, setLoading] = useState({
    tiers: false,
    sourceCards: false,
    versions: false
  });
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Sanitize tier data to ensure proper structure
  const sanitizeTierData = (tiers) => {
    if (!Array.isArray(tiers)) {
      console.warn('🔍 tiers is not an array, returning empty array');
      return [];
    }
    
    return tiers.map((tier, index) => {
      if (!tier || typeof tier !== 'object') {
        console.warn(`🔍 Tier ${index} is not a valid object, skipping`);
        return null;
      }
      
      // Ensure cards is always an array
      const sanitizedTier = {
        ...tier,
        cards: Array.isArray(tier.cards) ? tier.cards : []
      };
      
      // Log if we had to fix the cards property
      if (!Array.isArray(tier.cards)) {
        console.warn(`🔍 Fixed tier ${index} (${tier.name || tier.id}): cards was not an array, set to empty array`);
        console.warn(`🔍 Original cards value:`, tier.cards);
      }
      
      return sanitizedTier;
    }).filter(tier => tier !== null); // Remove any null tiers
  };

  const loadInitialData = async () => {
    console.log('🔍 loadInitialData called')
    try {
      setError(null);
      
      // Load tiers with cards
      setLoading(prev => ({ ...prev, tiers: true }));
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const loadedTiers = tiersResponse.data.data || tiersResponse.data;
      console.log('🔍 Loaded tiers from API:', loadedTiers)
      console.log('🔍 Loaded tiers length:', loadedTiers?.length)
      
      // Sanitize tier data to ensure proper structure
      const sanitizedTiers = sanitizeTierData(loadedTiers);
      console.log('🔍 Sanitized tiers:', sanitizedTiers)
      console.log('🔍 Sanitized tiers length:', sanitizedTiers?.length)
      
      setTiers(sanitizedTiers);
      
      // Check if we have at least 2 tiers (project requirement)
      if (!loadedTiers || loadedTiers.length < 2) {
        console.log('🔍 Board has insufficient tiers. Creating default tiers...');
        console.log('🔍 Current loadedTiers:', loadedTiers)
        console.log('🔍 Current loadedTiers length:', loadedTiers?.length)
        
        // Create default tiers (A, B, C, D, E) to meet the 5 default tiers requirement
        const defaultTiers = [
          { id: 'tier-a', name: 'A', color: 'bg-red-200', position: 0 },
          { id: 'tier-b', name: 'B', color: 'bg-orange-200', position: 1 },
          { id: 'tier-c', name: 'C', color: 'bg-yellow-200', position: 2 },
          { id: 'tier-d', name: 'D', color: 'bg-green-200', position: 3 },
          { id: 'tier-e', name: 'E', color: 'bg-blue-200', position: 4 }
        ];
        
        // Only create tiers that don't already exist
        for (let i = loadedTiers.length; i < 5; i++) {
          try {
            const tier = defaultTiers[i];
            await tierAPI.createTier(tier);
            console.log(`🔍 Created default tier: ${tier.name}`);
          } catch (err) {
            console.error(`🔍 Failed to create default tier ${defaultTiers[i].name}:`, err);
          }
        }
        
        // Reload tiers after creating defaults
        console.log('🔍 Reloading tiers after creating defaults...')
        const updatedTiersResponse = await tierAPI.getAllTiersWithCards();
        const updatedTiers = updatedTiersResponse.data.data || updatedTiersResponse.data;
        console.log('🔍 Updated tiers from API:', updatedTiers)
        console.log('🔍 Updated tiers length:', updatedTiers?.length)
        
        // Sanitize the updated tiers as well
        const sanitizedUpdatedTiers = sanitizeTierData(updatedTiers);
        console.log('🔍 Sanitized updated tiers:', sanitizedUpdatedTiers)
        console.log('🔍 Sanitized updated tiers length:', sanitizedUpdatedTiers?.length)
        
        setTiers(sanitizedUpdatedTiers);
      }
      
      // Load source cards grouped
      setLoading(prev => ({ ...prev, sourceCards: true }));
      const sourceCardsResponse = await sourceCardAPI.getAllSourceCardsGrouped();
      const loadedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      setSourceCards({
        competitors: loadedSourceCards.competitors || [],
        pages: loadedSourceCards.pages || [],
        personas: loadedSourceCards.personas || []
      });
      
      // Load versions
      setLoading(prev => ({ ...prev, versions: true }));
      const versionsResponse = await versionAPI.getAllVersions();
      const versions = versionsResponse.data.data || versionsResponse.data;
      setVersionHistory(versions);
      
      // Update current version index based on actual board state
      // Use the loaded data instead of the old state
      const finalTiers = tiersResponse.data.data || tiersResponse.data;
      const finalSourceCards = {
        competitors: loadedSourceCards.competitors || [],
        pages: loadedSourceCards.pages || [],
        personas: loadedSourceCards.personas || []
      };
      updateCurrentVersionIndex(versions, finalTiers, finalSourceCards);
      
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to load initial data');
      setError(errorMessage);
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(prev => ({ 
        tiers: false, 
        sourceCards: false, 
        versions: false 
      }));
    }
  };

  // Tier operations
  const createTier = async (tierData) => {
    try {
      console.log('🔍 createTier called with:', tierData)
      const response = await tierAPI.createTier(tierData);
      const newTier = response.data.data || response.data;
      
      console.log('🔍 New tier created:', newTier)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after create tier:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      // Sanitize the tiers data
      const sanitizedTiers = sanitizeTierData(updatedTiers);
      console.log('🔍 Sanitized tiers after create tier:', sanitizedTiers)
      console.log('🔍 Sanitized tiers length:', sanitizedTiers?.length)
      
      setTiers(sanitizedTiers);
      
      return newTier;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to create tier');
      setError(errorMessage);
      throw err;
    }
  };

  const updateTier = async (id, tierData) => {
    try {
      console.log('🔍 updateTier called with id:', id, 'data:', tierData)
      console.log('🔍 updateTier data type:', typeof tierData)
      console.log('🔍 updateTier data keys:', Object.keys(tierData))
      console.log('🔍 updateTier data stringified:', JSON.stringify(tierData, null, 2))
      
      const response = await tierAPI.updateTier(id, tierData);
      const updatedTier = response.data.data || response.data;
      
      console.log('🔍 Tier updated:', updatedTier)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after update tier:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      // Sanitize the tiers data
      const sanitizedTiers = sanitizeTierData(updatedTiers);
      console.log('🔍 Sanitized tiers after update tier:', sanitizedTiers)
      console.log('🔍 Sanitized tiers length:', sanitizedTiers?.length)
      
      setTiers(sanitizedTiers);
      
      return updatedTier;
    } catch (err) {
      console.log('🔍 updateTier error details:', err.response?.data)
      console.log('🔍 updateTier error status:', err.response?.status)
      console.log('🔍 updateTier error message:', err.message)
      
      const errorMessage = handleAPIError(err, 'Failed to update tier');
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTier = async (id) => {
    try {
      console.log('🔍 deleteTier called with id:', id)
      await tierAPI.deleteTier(id);
      
      console.log('🔍 Tier deleted, about to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after delete tier:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      // Sanitize the tiers data
      const sanitizedTiers = sanitizeTierData(updatedTiers);
      console.log('🔍 Sanitized tiers after delete tier:', sanitizedTiers)
      console.log('🔍 Sanitized tiers length:', sanitizedTiers?.length)
      
      setTiers(sanitizedTiers);
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete tier');
      setError(errorMessage);
      throw err;
    }
  };

  const moveTierPosition = async (id, direction) => {
    try {
      const response = await tierAPI.moveTierPosition(id, direction);
      const updatedTiers = response.data.data || response.data;
      setTiers(updatedTiers);
      return updatedTiers;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to move tier');
      setError(errorMessage);
      throw err;
    }
  };

  const duplicateTier = async (id) => {
    try {
      console.log('🔍 duplicateTier called with id:', id)
      const response = await tierAPI.duplicateTier(id);
      const newTier = response.data.data || response.data;
      
      console.log('🔍 Tier duplicated:', newTier)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after duplicate tier:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
      
      return newTier;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to duplicate tier');
      setError(errorMessage);
      throw err;
    }
  };

  const clearTierCards = async (id) => {
    try {
      console.log('🔍 clearTierCards called with id:', id)
      await tierAPI.clearTierCards(id);
      
      console.log('🔍 Tier cards cleared, about to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after clear tier cards:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to clear tier cards');
      setError(errorMessage);
      throw err;
    }
  };

  // Source card operations
  const createSourceCard = async (cardData) => {
    try {
      console.log('🔍 createSourceCard called with:', cardData)
      const response = await sourceCardAPI.createSourceCard(cardData);
      const newCard = response.data.data || response.data;
      console.log('🔍 New source card created:', newCard)
      
      console.log('🔍 About to reload source cards from API...')
      // Instead of updating local state, reload the entire source cards data from API
      // This ensures we always have the latest data including image URLs and avoids race conditions
      const sourceCardsResponse = await sourceCardAPI.getAllSourceCardsGrouped();
      const updatedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      console.log('🔍 Reloaded source cards from API:', updatedSourceCards)
      
      setSourceCards({
        competitors: updatedSourceCards.competitors || [],
        pages: updatedSourceCards.pages || [],
        personas: updatedSourceCards.personas || []
      });
      
      return newCard;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to create source card');
      setError(errorMessage);
      throw err;
    }
  };

  const updateSourceCard = async (id, cardData) => {
    try {
      console.log('🔍 updateSourceCard called with id:', id, 'cardData:', cardData)
      const response = await sourceCardAPI.updateSourceCard(id, cardData);
      const updatedCard = response.data.data || response.data;
      console.log('🔍 Source card updated:', updatedCard)
      
      console.log('🔍 About to reload source cards from API...')
      // Instead of updating local state, reload the entire source cards data from API
      // This ensures we always have the latest data including image URLs and avoids race conditions
      const sourceCardsResponse = await sourceCardAPI.getAllSourceCardsGrouped();
      const updatedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      console.log('🔍 Reloaded source cards from API:', updatedSourceCards)
      
      setSourceCards({
        competitors: updatedSourceCards.competitors || [],
        pages: updatedSourceCards.pages || [],
        personas: updatedSourceCards.personas || []
      });
      
      return updatedCard;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to update source card');
      setError(errorMessage);
      throw err;
    }
  };

  const deleteSourceCard = async (id, sourceCategory) => {
    try {
      console.log('🔍 deleteSourceCard called with id:', id, 'sourceCategory:', sourceCategory)
      await sourceCardAPI.deleteSourceCard(id);
      console.log('🔍 Source card deleted, about to reload source cards from API...')
      
      // Instead of updating local state, reload the entire source cards data from API
      // This ensures we always have the latest data and avoids race conditions
      const sourceCardsResponse = await sourceCardAPI.getAllSourceCardsGrouped();
      const updatedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      console.log('🔍 Reloaded source cards from API:', updatedSourceCards)
      
      setSourceCards({
        competitors: updatedSourceCards.competitors || [],
        pages: updatedSourceCards.pages || [],
        personas: updatedSourceCards.personas || []
      });
      
      // Also remove from tiers (cascade delete)
      setTiers(prev => prev.map(tier => ({
        ...tier,
        cards: (tier.cards || []).filter(card => 
          !(card.text === sourceCards[sourceCategory]?.find(c => c.id === id)?.text && 
            card.type === sourceCards[sourceCategory]?.find(c => c.id === id)?.type)
        )
      })));
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete source card');
      setError(errorMessage);
      throw err;
    }
  };

  // Card operations
  const createCard = async (cardData) => {
    console.log('🔍 createCard called with:', cardData)
    console.log('🔍 Current tiers in createCard:', tiers)
    console.log('🔍 Current tiers length in createCard:', tiers?.length)
    
    try {
      const response = await cardAPI.createCard(cardData);
      const newCard = response.data.data || response.data;
      
      console.log('🔍 New card created:', newCard)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      console.log('🔍 About to set tiers state with reloaded data...')
      
      setTiers(updatedTiers);
      
      console.log('🔍 setTiers called with reloaded data, returning newCard')
      return newCard;
    } catch (err) {
      console.error('🔍 Error in createCard:', err)
      const errorMessage = handleAPIError(err, 'Failed to create card');
      setError(errorMessage);
      throw err;
    }
  };

  const updateCard = async (id, cardData) => {
    try {
      const response = await cardAPI.updateCard(id, cardData);
      const updatedCard = response.data.data || response.data;
      
      console.log('🔍 Card updated:', updatedCard)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after update:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
      
      // Update in source cards if it's a source card
      if (cardData.sourceCategory) {
        setSourceCards(prev => ({
          ...prev,
          [cardData.sourceCategory]: (prev[cardData.sourceCategory] || []).map(card =>
            card.id === id ? updatedCard : card
          )
        }));
      }
      
      return updatedCard;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to update card');
      setError(errorMessage);
      throw err;
    }
  };

  const deleteCard = async (id) => {
    try {
      await cardAPI.deleteCard(id);
      
      console.log('🔍 Card deleted, about to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after delete:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
      
      // Remove from source cards
      setSourceCards(prev => ({
        competitors: (prev.competitors || []).filter(card => card.id !== id),
        pages: (prev.pages || []).filter(card => card.id !== id),
        personas: (prev.personas || []).filter(card => card.id !== id)
      }));
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete card');
      setError(errorMessage);
      throw err;
    }
  };

  const moveCard = async (id, moveData) => {
    try {
      const response = await cardAPI.moveCard(id, moveData);
      const updatedTiers = response.data.data || response.data;
      
      // Validate that updatedTiers is an array and has the expected structure
      if (Array.isArray(updatedTiers)) {
        setTiers(updatedTiers);
      } else {
        console.error('Invalid tiers data received from moveCard API:', updatedTiers);
        // Fallback: reload all data to ensure consistency
        await loadInitialData();
      }
      
      return updatedTiers;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to move card');
      setError(errorMessage);
      throw err;
    }
  };

  const duplicateCard = async (id) => {
    try {
      const response = await cardAPI.duplicateCard(id);
      const newCard = response.data.data || response.data;
      
      console.log('🔍 Card duplicated:', newCard)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after duplicate:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
      
      return newCard;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to duplicate card');
      setError(errorMessage);
      throw err;
    }
  };

  const toggleCardHidden = async (id) => {
    try {
      const response = await cardAPI.toggleCardHidden(id);
      const updatedCard = response.data.data || response.data;
      
      console.log('🔍 Card hidden status toggled:', updatedCard)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after toggle hidden:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
      
      return updatedCard;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to toggle card hidden status');
      setError(errorMessage);
      throw err;
    }
  };

  // Comment operations
  const createComment = async (commentData) => {
    try {
      const response = await commentAPI.createComment(commentData);
      const newComment = response.data.data || response.data;
      
      console.log('🔍 Comment created:', newComment)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after create comment:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
      
      return newComment;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to create comment');
      setError(errorMessage);
      throw err;
    }
  };

  const deleteComment = async (id, cardId) => {
    try {
      await commentAPI.deleteComment(id);
      
      console.log('🔍 Comment deleted, about to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after delete comment:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiers(updatedTiers);
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete comment');
      setError(errorMessage);
      throw err;
    }
  };

  // Version operations
  const createVersion = async (versionData) => {
    try {
      const response = await versionAPI.createVersion(versionData);
      const newVersion = response.data.data || response.data;
      setVersionHistory(prev => [...prev, newVersion]);
      setCurrentVersionIndex(prev => prev + 1);
      return newVersion;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to create version');
      setError(errorMessage);
      throw err;
    }
  };

  const restoreVersion = async (id) => {
    try {
      const response = await versionAPI.restoreVersion(id);
      const restoredVersion = response.data.data || response.data;
      
      // Find the restored version in the version history and set it as current
      const versionIndex = versionHistory.findIndex(v => v.id === id);
      if (versionIndex !== -1) {
        setCurrentVersionIndex(versionIndex);
      }
      
      // The backend restores data to the database but returns the version object
      // We need to reload the data to get the restored state
      return restoredVersion;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to restore version');
      setError(errorMessage);
      throw err;
    }
  };

  // Import cards to tier
  const importCardsToTier = async (importData) => {
    try {
      console.log('🔍 importCardsToTier called with:', importData);
      
      const response = await sourceCardAPI.importCardsToTier(importData);
      const updatedTiers = response.data.data || response.data;
      
      console.log('🔍 Response from importCardsToTier API:', response.data);
      console.log('🔍 Updated tiers data:', updatedTiers);
      
      // Sanitize the tiers data to ensure proper structure
      const sanitizedTiers = sanitizeTierData(updatedTiers);
      console.log('🔍 Sanitized tiers from import:', sanitizedTiers);
      
      // Validate that updatedTiers is an array and has the expected structure
      if (Array.isArray(sanitizedTiers) && sanitizedTiers.length > 0) {
        // Additional validation: check that each tier has the expected structure
        const validationResults = sanitizedTiers.map((tier, index) => {
          if (!tier || typeof tier !== 'object') {
            return { index, valid: false, error: 'Tier is not an object' };
          }
          
          const requiredProps = ['id', 'name', 'color', 'position', 'cards'];
          const missingProps = requiredProps.filter(prop => !(prop in tier));
          
          if (missingProps.length > 0) {
            return { index, valid: false, error: `Missing properties: ${missingProps.join(', ')}` };
          }
          
          if (!Array.isArray(tier.cards)) {
            return { index, valid: false, error: 'cards property is not an array' };
          }
          
          return { index, valid: true };
        });
        
        const invalidTiers = validationResults.filter(result => !result.valid);
        
        if (invalidTiers.length === 0) {
          console.log('🔍 Setting tiers with validated data:', sanitizedTiers.length, 'tiers');
          setTiers(sanitizedTiers);
        } else {
          console.error('🔍 Invalid tier structure detected:');
          invalidTiers.forEach(result => {
            console.error(`  Tier ${result.index}: ${result.error}`);
            console.error(`  Tier data:`, sanitizedTiers[result.index]);
          });
          console.error('🔍 All tiers data:', sanitizedTiers);
          // Fallback: reload all data to ensure consistency
          await loadInitialData();
        }
      } else {
        console.error('🔍 Invalid tiers data received from importCardsToTier API:', updatedTiers);
        // Fallback: reload all data to ensure consistency
        await loadInitialData();
      }
      
      return updatedTiers;
    } catch (err) {
      console.error('🔍 Error in importCardsToTier:', err);
      const errorMessage = handleAPIError(err, 'Failed to import cards');
      setError(errorMessage);
      throw err;
    }
  };

  // Move all cards from one tier to another tier
  const moveCardsToTier = async (sourceTierId, targetTierId) => {
    try {
      console.log('🔍 moveCardsToTier called with sourceTierId:', sourceTierId, 'targetTierId:', targetTierId)
      
      // Get the source tier to find its cards
      const sourceTier = tiers.find(tier => tier.id === sourceTierId)
      if (!sourceTier) {
        throw new Error('Source tier not found')
      }
      
      const cardsToMove = sourceTier.cards || []
      console.log('🔍 Cards to move:', cardsToMove.length)
      
      if (cardsToMove.length === 0) {
        console.log('🔍 No cards to move, proceeding with tier deletion')
        await deleteTier(sourceTierId)
        return
      }
      
      // Move each card to the target tier
      for (const card of cardsToMove) {
        console.log('🔍 Moving card:', card.id, 'to tier:', targetTierId)
        await cardAPI.moveCard(card.id, {
          targetTierId: targetTierId,
          position: undefined // Let the backend determine the position
        })
      }
      
      console.log('🔍 All cards moved, now deleting the source tier')
      
      // Now delete the source tier (which should be empty)
      await deleteTier(sourceTierId)
      
      console.log('🔍 moveCardsToTier completed successfully')
    } catch (err) {
      console.error('🔍 Error in moveCardsToTier:', err)
      const errorMessage = handleAPIError(err, 'Failed to move cards to tier');
      setError(errorMessage);
      throw err;
    }
  };

  // Delete all cards in a tier and then delete the tier
  const deleteCardsAndTier = async (tierId) => {
    try {
      console.log('🔍 deleteCardsAndTier called with tierId:', tierId)
      
      // Get the tier to find its cards
      const tier = tiers.find(t => t.id === tierId)
      if (!tier) {
        throw new Error('Tier not found')
      }
      
      const cardsToDelete = tier.cards || []
      console.log('🔍 Cards to delete:', cardsToDelete.length)
      
      // Delete each card in the tier
      for (const card of cardsToDelete) {
        console.log('🔍 Deleting card:', card.id)
        await cardAPI.deleteCard(card.id)
      }
      
      console.log('🔍 All cards deleted, now deleting the tier')
      
      // Now delete the tier (which should be empty)
      await deleteTier(tierId)
      
      console.log('🔍 deleteCardsAndTier completed successfully')
    } catch (err) {
      console.error('🔍 Error in deleteCardsAndTier:', err)
      const errorMessage = handleAPIError(err, 'Failed to delete cards and tier');
      setError(errorMessage);
      throw err;
    }
  };

  // Utility functions
  const clearError = () => setError(null);

  const refreshData = async () => {
    await loadInitialData();
  };

  // Update current version index whenever board state changes
  useEffect(() => {
    if (versionHistory.length > 0 && tiers.length > 0) {
      updateCurrentVersionIndex(versionHistory, tiers, sourceCards);
    }
  }, [tiers, sourceCards, versionHistory]);

  // Helper function to determine if current board state matches a version
  const isCurrentVersion = (version, currentTiers, currentSourceCards) => {
    try {
      // Parse version data
      const versionTiersData = version.tiersData || version.tiersdata;
      const versionSourceCardsData = version.sourceCardsData || version.sourcecardsdata;
      
      let versionTiers, versionSourceCards;
      
      if (typeof versionTiersData === 'string') {
        versionTiers = JSON.parse(versionTiersData);
      } else {
        versionTiers = versionTiersData;
      }
      
      if (typeof versionSourceCardsData === 'string') {
        versionSourceCards = JSON.parse(versionSourceCardsData);
      } else {
        versionSourceCards = versionSourceCardsData;
      }
      
      if (!versionTiers || !versionSourceCards) {
        return false;
      }
      
      // Compare tiers
      if (versionTiers.length !== currentTiers.length) {
        return false;
      }
      
      for (let i = 0; i < versionTiers.length; i++) {
        const versionTier = versionTiers[i];
        const currentTier = currentTiers[i];
        
        if (!currentTier || 
            versionTier.id !== currentTier.id ||
            versionTier.name !== currentTier.name ||
            versionTier.color !== currentTier.color ||
            versionTier.position !== currentTier.position) {
          return false;
        }
        
        // Compare cards in tier
        const versionCards = versionTier.cards || [];
        const currentCards = currentTier.cards || [];
        
        if (versionCards.length !== currentCards.length) {
          return false;
        }
        
        for (let j = 0; j < versionCards.length; j++) {
          const versionCard = versionCards[j];
          const currentCard = currentCards[j];
          
          if (!currentCard ||
              versionCard.id !== currentCard.id ||
              versionCard.text !== currentCard.text ||
              versionCard.type !== currentCard.type ||
              versionCard.subtype !== currentCard.subtype ||
              versionCard.position !== currentCard.position) {
            return false;
          }
        }
      }
      
      // Compare source cards
      const sourceCategories = ['competitors', 'pages', 'personas'];
      for (const category of sourceCategories) {
        const versionCategoryCards = versionSourceCards[category] || [];
        const currentCategoryCards = currentSourceCards[category] || [];
        
        if (versionCategoryCards.length !== currentCategoryCards.length) {
          return false;
        }
        
        for (let i = 0; i < versionCategoryCards.length; i++) {
          const versionCard = versionCategoryCards[i];
          const currentCard = currentCategoryCards[i];
          
          if (!currentCard ||
              versionCard.id !== currentCard.id ||
              versionCard.text !== currentCard.text ||
              versionCard.type !== currentCard.type) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error comparing version state:', error);
      return false;
    }
  };

  // Function to update current version index based on actual board state
  const updateCurrentVersionIndex = (versions, currentTiers, currentSourceCards) => {
    for (let i = versions.length - 1; i >= 0; i--) {
      if (isCurrentVersion(versions[i], currentTiers, currentSourceCards)) {
        setCurrentVersionIndex(i);
        return;
      }
    }
    // If no version matches, set to -1 (no current version)
    setCurrentVersionIndex(-1);
  };

  return {
    // Data
    tiers,
    sourceCards,
    versionHistory,
    currentVersionIndex,
    
    // Loading and error states
    loading,
    setLoading,
    error,
    setError,
    
    // Tier operations
    createTier,
    updateTier,
    deleteTier,
    moveTierPosition,
    duplicateTier,
    clearTierCards,
    moveCardsToTier,
    deleteCardsAndTier,
    
    // Source card operations
    createSourceCard,
    updateSourceCard,
    deleteSourceCard,
    
    // Card operations
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    duplicateCard,
    toggleCardHidden,
    
    // Comment operations
    createComment,
    deleteComment,
    
    // Version operations
    createVersion,
    restoreVersion,
    
    // Import operations
    importCardsToTier,
    
    // Utility functions
    clearError,
    refreshData,
  };
}; 