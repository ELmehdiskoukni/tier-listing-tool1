import { useState, useEffect, useCallback, useRef } from 'react';
import { tierAPI, sourceCardAPI, cardAPI, commentAPI, versionAPI, handleAPIError } from '../api/apiClient';
import { useUndoRedo, ACTION_TYPES } from './useUndoRedo';

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

  // Undo/Redo functionality
  const {
    addAction,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    getNextUndoDescription,
    getNextRedoDescription,
    isPerformingAction,
    undoStackLength,
    redoStackLength
  } = useUndoRedo();

  // Autosave refs and helpers
  const isInitialLoadRef = useRef(true);
  const autosaveTimerRef = useRef(null);
  const lastSavedHashRef = useRef(null);
  const lastActionDescriptionRef = useRef('');
  const suppressNextAutosaveRef = useRef(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  // Prevent overlapping server mutations during undo/redo and new actions
  const serverSyncInProgressRef = useRef(false);
  // Prevent automatic currentVersionIndex updates during manual undo/redo operations
  const suppressVersionIndexUpdateRef = useRef(false);
  // Tiers explicitly suppressed locally (e.g., undone duplicates) to avoid ghost reappearance
  const suppressedTierIdsRef = useRef(new Set());
  const SUPPRESSED_STORAGE_KEY = 'suppressedTierIds';

  // Allow UI to set the next autosave description explicitly
  const setNextAutosaveDescription = useCallback((description) => {
    if (typeof description === 'string') {
      lastActionDescriptionRef.current = description;
    }
  }, []);

  // Manual version index update for restore operations
  const setManualVersionIndex = useCallback((versionId) => {
    if (!Array.isArray(versionHistory) || versionHistory.length === 0) return;
    const targetIndex = versionHistory.findIndex(v => v.id === versionId);
    if (targetIndex !== -1) {
      suppressVersionIndexUpdateRef.current = true;
      setCurrentVersionIndex(targetIndex);
    }
  }, [versionHistory]);

  // Version operations - moved here to fix hoisting issue with autosaveNow
  const createVersion = useCallback(async (versionData) => {
    try {
      // If we're not at the latest version (currentVersionIndex > 0), truncate future versions
      if (currentVersionIndex > 0) {
        // Delete all versions before the current index (newer versions that we're abandoning)
        const versionsToDelete = versionHistory.slice(0, currentVersionIndex);
        for (const version of versionsToDelete) {
          try {
            await versionAPI.deleteVersion(version.id);
          } catch (deleteErr) {
            console.warn('Failed to delete future version:', version.id, deleteErr);
          }
        }
        // Update local version history to remove deleted versions
        setVersionHistory(prev => prev.slice(currentVersionIndex));
        setCurrentVersionIndex(0); // Reset to point to what is now the latest
      }

      // Let backend stamp created_at in UTC to ensure consistency on refresh
      const response = await versionAPI.createVersion(versionData);
      const newVersion = response.data.data || response.data;
      // Normalize created_at to ISO string for reliable parsing
      if (newVersion && newVersion.created_at && typeof newVersion.created_at !== 'string') {
        try {
          newVersion.created_at = new Date(newVersion.created_at).toISOString();
        } catch {}
      }
      // Ensure we have an ISO UTC string
      if (newVersion && typeof newVersion.created_at === 'string' && /\d{4}-\d{2}-\d{2}T/.test(newVersion.created_at) && !/Z|[+-]\d{2}:?\d{2}$/.test(newVersion.created_at)) {
        newVersion.created_at = `${newVersion.created_at}Z`;
      }
      setVersionHistory(prev => [newVersion, ...prev]); // Add new version at the top
      setCurrentVersionIndex(0); // New version becomes current
      return newVersion;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to create version');
      setError(errorMessage);
      throw err;
    }
  }, [currentVersionIndex, versionHistory, setVersionHistory, setCurrentVersionIndex, setError]);

  // Immediate autosave utility (bypasses debounce)
  const autosaveNow = useCallback(async (descriptionOverride) => {
    try {
      const desc = (descriptionOverride || lastActionDescriptionRef.current || 'Board updated').trim();
      if (!desc || desc.toLowerCase() === 'board updated') return;
      // Use createVersion to handle version history truncation properly
      const version = await createVersion({
        description: desc,
        tiersData: JSON.parse(JSON.stringify(tiers)),
        sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
      });
      // Mark as saved to prevent immediate duplicate from debounce
      lastSavedHashRef.current = JSON.stringify({ t: tiers, s: sourceCards });
      setToast({ type: 'success', message: 'Changes saved', duration: 2500 });
      return version;
    } catch (e) {
      console.error('Immediate autosave failed:', e);
      setToast({ type: 'error', message: 'Failed to save changes', duration: 3000 });
      return null;
    }
  }, [tiers, sourceCards, createVersion, currentVersionIndex, versionHistory]);

  // Auto-dismiss toast after duration
  useEffect(() => {
    if (toast && toast.duration) {
      // Clear any existing timer
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      
      // Set new timer
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, toast.duration);
    }

    // Cleanup on unmount
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [toast]);

  // Helper to apply server tiers safely (sanitize + filter suppressed)
  const setTiersFiltered = useCallback((tiersInput) => {
    const sanitized = sanitizeTierData(tiersInput);
    const filtered = sanitized.filter(t => !suppressedTierIdsRef.current.has(t.id));
    setTiers(filtered);
  }, []);

  // Persist/load suppression set across refreshes
  const loadSuppressedFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(SUPPRESSED_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) suppressedTierIdsRef.current = new Set(arr);
      }
    } catch (_) { /* ignore */ }
  }, []);

  const saveSuppressedToStorage = useCallback(() => {
    try {
      localStorage.setItem(
        SUPPRESSED_STORAGE_KEY,
        JSON.stringify(Array.from(suppressedTierIdsRef.current))
      );
    } catch (_) { /* ignore */ }
  }, []);

  // Load initial data
  useEffect(() => {
    loadSuppressedFromStorage();
    loadInitialData();
  }, [loadSuppressedFromStorage]);

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

  // Helper function to create action objects for undo/redo
  const createAction = useCallback((type, description, previousState, newState, meta = null) => {
    // Record the latest human description for autosave labeling
    lastActionDescriptionRef.current = description || '';
    return {
      type,
      description,
      previousState: JSON.parse(JSON.stringify(previousState)),
      newState: JSON.parse(JSON.stringify(newState)),
      meta,
      timestamp: Date.now()
    };
  }, []);

// Helper function to restore state from action
const restoreStateFromAction = useCallback((action, isUndo = true) => {
  // Get the appropriate state based on whether we're undoing or redoing
  const stateToRestore = isUndo ? action.previousState : action.newState;
  
  console.log(`Restoring state from ${isUndo ? 'previous' : 'new'} state for action:`, action.type, action.description);
  console.log('State to restore:', {
    tiers: stateToRestore.tiers?.length || 0,
    tierIds: stateToRestore.tiers?.map(t => t.id) || [],
    sourceCards: Object.keys(stateToRestore.sourceCards || {})
  });
  
  if (stateToRestore.tiers) {
    // Deep clone the tiers to ensure we don't have reference issues
    const clonedTiers = JSON.parse(JSON.stringify(stateToRestore.tiers));
    
    // Validate the tiers data before setting state
    const sanitizedTiers = sanitizeTierData(clonedTiers);
    console.log('Sanitized tiers for state restoration:', {
      count: sanitizedTiers.length,
      ids: sanitizedTiers.map(t => t.id)
    });
    
    // Set the validated tiers
    setTiersFiltered(sanitizedTiers);
  }
  
  if (stateToRestore.sourceCards) {
    // Deep clone the source cards to ensure we don't have reference issues
    const clonedSourceCards = JSON.parse(JSON.stringify(stateToRestore.sourceCards));
    setSourceCards(clonedSourceCards);
  }
  
  // Make sure the suppression flag is set to prevent autosave immediately after restore
  suppressNextAutosaveRef.current = true;
}, []);



// Undo: navigate to previous version in versionHistory
const handleUndo = useCallback(async () => {
  try {
    if (!Array.isArray(versionHistory) || versionHistory.length === 0) return;
    if (currentVersionIndex >= versionHistory.length - 1) {
      setToast({ type: 'info', message: 'Already at oldest version', duration: 2500 });
      return;
    }
    const targetIndex = currentVersionIndex + 1;
    const targetVersion = versionHistory[targetIndex];

    suppressNextAutosaveRef.current = true;
    suppressVersionIndexUpdateRef.current = true;
    serverSyncInProgressRef.current = true;
    
    // Restore the target version
    await versionAPI.restoreVersion(targetVersion.id);

    // Reload data from server after restoration
    const [tiersResponse, sourceCardsResponse] = await Promise.all([
      tierAPI.getAllTiersWithCards(),
      sourceCardAPI.getAllSourceCardsGrouped()
    ]);
    setTiersFiltered(tiersResponse.data.data || tiersResponse.data);
    const reloadedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
    setSourceCards({
      competitors: reloadedSourceCards.competitors || [],
      pages: reloadedSourceCards.pages || [],
      personas: reloadedSourceCards.personas || []
    });

    // Update currentVersionIndex to point to the restored version
    setCurrentVersionIndex(targetIndex);
    
    // Autosave the restored state as the current state (without creating a new version)
    const currentHash = computeStateHash(tiersResponse.data.data || tiersResponse.data, {
      competitors: reloadedSourceCards.competitors || [],
      pages: reloadedSourceCards.pages || [],
      personas: reloadedSourceCards.personas || []
    });
    lastSavedHashRef.current = currentHash;
    
    setToast({ type: 'info', message: `Reverted to: ${targetVersion?.description || 'previous version'}`, duration: 3000 });
  } catch (error) {
    console.error('Error during version-undo operation:', error);
    setError('Failed to load previous version. Please try again.');
  } finally {
    serverSyncInProgressRef.current = false;
  }
}, [versionHistory, currentVersionIndex, setError]);

// Redo: navigate to next (newer) version in versionHistory
const handleRedo = useCallback(async () => {
  try {
    if (!Array.isArray(versionHistory) || versionHistory.length === 0) return;
    if (currentVersionIndex <= 0) {
      setToast({ type: 'info', message: 'Already at latest version', duration: 2500 });
      return;
    }
    const targetIndex = currentVersionIndex - 1;
    const targetVersion = versionHistory[targetIndex];

    suppressNextAutosaveRef.current = true;
    suppressVersionIndexUpdateRef.current = true;
    serverSyncInProgressRef.current = true;
    
    // Restore the target version
    await versionAPI.restoreVersion(targetVersion.id);

    // Reload data from server after restoration
    const [tiersResponse, sourceCardsResponse] = await Promise.all([
      tierAPI.getAllTiersWithCards(),
      sourceCardAPI.getAllSourceCardsGrouped()
    ]);
    setTiersFiltered(tiersResponse.data.data || tiersResponse.data);
    const reloadedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
    setSourceCards({
      competitors: reloadedSourceCards.competitors || [],
      pages: reloadedSourceCards.pages || [],
      personas: reloadedSourceCards.personas || []
    });

    // Update currentVersionIndex to point to the restored version
    setCurrentVersionIndex(targetIndex);
    
    // Autosave the restored state as the current state (without creating a new version)
    const currentHash = computeStateHash(tiersResponse.data.data || tiersResponse.data, {
      competitors: reloadedSourceCards.competitors || [],
      pages: reloadedSourceCards.pages || [],
      personas: reloadedSourceCards.personas || []
    });
    lastSavedHashRef.current = currentHash;
    
    setToast({ type: 'info', message: `Advanced to: ${targetVersion?.description || 'next version'}`, duration: 3000 });
  } catch (error) {
    console.error('Error during version-redo operation:', error);
    setError('Failed to load next version. Please try again.');
  } finally {
    serverSyncInProgressRef.current = false;
  }
}, [versionHistory, currentVersionIndex, setError]);

// Fixed duplicateTier function to properly track undo/redo metadata
const duplicateTier = async (id) => {
  try {
    // If an undo/redo server sync is still in progress, wait until it finishes to avoid race conditions
    while (serverSyncInProgressRef.current) {
      // Small delay loop; typically very short-lived
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    // Store previous state for undo BEFORE making any changes
    const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
    
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
    
    // Sanitize the tiers data
    let sanitizedTiers = sanitizeTierData(updatedTiers);

    // Keep only the newly created tier as the delta vs previousState; remove any other extras
    const prevIds = new Set((previousState.tiers || []).map(t => t.id));
    const extras = sanitizedTiers.filter(t => !prevIds.has(t.id));
    if (extras.length > 1) {
      for (const extra of extras) {
        if (extra.id !== newTier.id) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await tierAPI.deleteTier(extra.id);
          } catch (e) {
            console.warn('Failed to delete unexpected extra tier after duplicate:', extra.id, e);
          }
        }
      }
      const tiersResponse2 = await tierAPI.getAllTiersWithCards();
      const updatedTiers2 = tiersResponse2.data.data || tiersResponse2.data;
      sanitizedTiers = sanitizeTierData(updatedTiers2);
    }

    // Filter out suppressed tiers before setting state
    setTiersFiltered(sanitizedTiers);

    // Track action for undo/redo (only if not during undo/redo operation)
    if (!isPerformingAction) {
      const newState = { tiers: sanitizedTiers, sourceCards: { ...sourceCards } };
      const sourceTier = tiers.find(t => t.id === id);
      const description = `Duplicated tier "${sourceTier?.name || 'Tier'}"`;
      
      addAction(createAction(
        ACTION_TYPES.DUPLICATE_TIER,
        description,
        previousState,
        newState,
        { sourceTierId: id, newTierId: newTier.id }
      ));
    }
    
    // Version history: Duplicated tier
    try {
      const sourceTier = tiers.find(t => t.id === id);
      const description = `Duplicated tier '${sourceTier?.name || 'Tier'}'`;
      await createVersion({
        description,
        tiersData: JSON.parse(JSON.stringify(sanitizedTiers)),
        sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
      });
    } catch (e) {
      console.warn('Failed to create version for duplicateTier:', e);
    }
    
    return newTier;
  } catch (err) {
    const errorMessage = handleAPIError(err, 'Failed to duplicate tier');
    setError(errorMessage);
    throw err;
  }
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
      let sanitizedTiers = sanitizeTierData(loadedTiers);
      console.log('🔍 Sanitized tiers:', sanitizedTiers)
      console.log('🔍 Sanitized tiers length:', sanitizedTiers?.length)
      
      setTiersFiltered(sanitizedTiers);
      
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
        
        setTiersFiltered(sanitizedUpdatedTiers);
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
      // Debug raw versions
      console.log('[VersionLoad] Raw versions from API:', versions)
      // Ensure versions are sorted by creation time (newest first)
      const sortedVersions = versions
        .map(v => {
          // Normalize to ISO UTC string consistently
          let createdAtIso = v.created_at
          if (createdAtIso instanceof Date) createdAtIso = createdAtIso.toISOString()
          if (typeof createdAtIso === 'string' && /\d{4}-\d{2}-\d{2}T/.test(createdAtIso) && !/Z|[+-]\d{2}:?\d{2}$/.test(createdAtIso)) {
            createdAtIso = `${createdAtIso}Z`
          }
          return { ...v, created_at: createdAtIso }
        })
        .sort((a, b) => new Date(a.created_at) < new Date(b.created_at) ? 1 : -1);
      console.log('[VersionLoad] Sorted versions:', sortedVersions.map(v => ({ id: v.id, created_at: v.created_at })))
      setVersionHistory(sortedVersions);
      
      // Update current version index based on actual board state
      // Use the loaded data instead of the old state
      const finalTiers = tiersResponse.data.data || tiersResponse.data;
      const finalSourceCards = {
        competitors: loadedSourceCards.competitors || [],
        pages: loadedSourceCards.pages || [],
        personas: loadedSourceCards.personas || []
      };
      // Use the sorted list to keep indices aligned with UI
      updateCurrentVersionIndex(sortedVersions, finalTiers, finalSourceCards);
      
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
      // Store previous state for undo
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
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
      
      setTiersFiltered(sanitizedTiers);
      
      // Track action for undo/redo (only if not during undo/redo operation)
      if (!isPerformingAction) {
        const newState = { tiers: sanitizedTiers, sourceCards: { ...sourceCards } };
        const description = `Added tier "${newTier.name || 'Tier'}"`;
        
        addAction(createAction(
          ACTION_TYPES.ADD_TIER,
          description,
          previousState,
          newState
        ));
      }
      
      // Version history: Added tier
      try {
        const description = `Added tier '${newTier.name || 'Tier'}'`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(sanitizedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for createTier:', e);
      }
      
      return newTier;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to create tier');
      setError(errorMessage);
      throw err;
    }
  };

  const updateTier = async (id, tierData) => {
    try {
      // Store previous state for undo
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
      // Find the tier before update for undo description
      const tierToUpdate = tiers.find(t => t.id === id);
      
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
      
      setTiersFiltered(sanitizedTiers);
      
      // Track action for undo/redo (only if not during undo/redo operation)
      if (!isPerformingAction) {
        const newState = { tiers: sanitizedTiers, sourceCards: { ...sourceCards } };
        let description = `Updated tier "${tierToUpdate?.name || 'Tier'}"`;
        
        if (tierData.name && tierData.name !== tierToUpdate?.name) {
          description = `Renamed tier from "${tierToUpdate?.name || 'Tier'}" to "${tierData.name}"`;
        } else if (tierData.color && tierData.color !== tierToUpdate?.color) {
          description = `Changed tier "${tierToUpdate?.name || 'Tier'}" color to ${tierData.color.replace('bg-', '').replace('-200', '')}`;
        }
        
        addAction(createAction(
          ACTION_TYPES.UPDATE_TIER,
          description,
          previousState,
          newState
        ));
      }
      
      // Version history: Updated/Renamed/Color changed tier
      try {
        let vDesc = `Updated tier '${tierToUpdate?.name || 'Tier'}'`;
        if (tierData.name && tierData.name !== tierToUpdate?.name) {
          vDesc = `Renamed tier '${tierToUpdate?.name || 'Tier'}' to '${tierData.name}'`;
        } else if (tierData.color && tierData.color !== tierToUpdate?.color) {
          vDesc = `Changed tier '${tierToUpdate?.name || 'Tier'}' color to ${tierData.color.replace('bg-', '').replace('-200', '')}`;
        }
        await createVersion({
          description: vDesc,
          tiersData: JSON.parse(JSON.stringify(sanitizedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for updateTier:', e);
      }
      
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
      // Store previous state for undo
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
      // Find the tier before deletion for undo description
      const tierToDelete = tiers.find(t => t.id === id);
      
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
      
      setTiersFiltered(sanitizedTiers);
      
      // Track action for undo/redo (only if not during undo/redo operation)
      if (!isPerformingAction) {
        const newState = { tiers: sanitizedTiers, sourceCards: { ...sourceCards } };
        const description = `Deleted tier "${tierToDelete?.name || 'Tier'}"`;
        
        addAction(createAction(
          ACTION_TYPES.DELETE_TIER,
          description,
          previousState,
          newState
        ));
      }
      
      // Version history: Deleted tier
      try {
        const description = `Deleted tier '${tierToDelete?.name || 'Tier'}'`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(sanitizedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for deleteTier:', e);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete tier');
      setError(errorMessage);
      throw err;
    }
  };

  const moveTierPosition = async (id, direction) => {
    try {
      // Store previous state for undo
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
      // Find the tier before moving for undo description
      const tierToMove = tiers.find(t => t.id === id);
      
      const response = await tierAPI.moveTierPosition(id, direction);
      const updatedTiers = response.data.data || response.data;
      setTiersFiltered(updatedTiers);
      
      // Track action for undo/redo (only if not during undo/redo operation)
      if (!isPerformingAction) {
        const newState = { tiers: updatedTiers, sourceCards: { ...sourceCards } };
        const description = `Moved tier "${tierToMove?.name || 'Tier'}" ${direction === 'up' ? 'up' : 'down'}`;
        
        addAction(createAction(
          ACTION_TYPES.MOVE_TIER,
          description,
          previousState,
          newState
        ));
      }
      
      // Version history: Reordered tier
      try {
        const description = `Reordered tiers: moved '${tierToMove?.name || 'Tier'}' ${direction === 'up' ? 'up' : 'down'}`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(updatedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for moveTierPosition:', e);
      }
      
      return updatedTiers;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to move tier');
      setError(errorMessage);
      throw err;
    }
  };

// Fixed duplicateTier function in useTierBoard.js


// const duplicateTier = async (id) => {
//   try {
//     console.log('🔍 duplicateTier called with id:', id)
    
//     // Store previous state for undo BEFORE any API call
//     const previousState = { 
//       tiers: JSON.parse(JSON.stringify(tiers)), 
//       sourceCards: JSON.parse(JSON.stringify(sourceCards)) 
//     };
    
//     const response = await tierAPI.duplicateTier(id);
//     const newTier = response.data.data || response.data;
    
//     console.log('🔍 Tier duplicated:', newTier)
//     console.log('🔍 About to reload tiers from API...')
    
//     // Instead of updating local state, reload the entire tiers data from API
//     // This ensures we always have the latest data and avoids race conditions
//     const tiersResponse = await tierAPI.getAllTiersWithCards();
//     const updatedTiers = tiersResponse.data.data || tiersResponse.data;
    
//     console.log('🔍 Reloaded tiers from API after duplicate tier:', updatedTiers)
//     console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
    
//     // Apply the new state to the UI
//     setTiersFiltered(updatedTiers);

//     // Track undo/redo for duplicate tier
//     // Create a deep copy of the new state to ensure it's separate from the current state
//     const newState = { 
//       tiers: JSON.parse(JSON.stringify(updatedTiers)), 
//       sourceCards: JSON.parse(JSON.stringify(sourceCards)) 
//     };
    
//     // Get source and target tier information for better descriptions and meta info
//     const sourceTier = previousState.tiers.find(t => t.id === id);
//     const createdTier = updatedTiers.find(t => !previousState.tiers.some(prev => prev.id === t.id));
    
//     const description = `Duplicated tier ${sourceTier?.name || ''}`.trim();
    
//     addAction(createAction(
//       ACTION_TYPES.DUPLICATE_TIER,
//       description,
//       previousState,
//       newState,
//       { 
//         sourceTierId: id, 
//         newTierId: createdTier?.id,
//         actionTimestamp: Date.now() // Add timestamp for debugging
//       }
//     ));
    
//     return newTier;
//   } catch (err) {
//     const errorMessage = handleAPIError(err, 'Failed to duplicate tier');
//     setError(errorMessage);
//     throw err;
//   }
// };

  const clearTierCards = async (id) => {
    try {
      // Store previous state for undo
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
      // Find the tier before clearing for undo description
      const tierToClear = tiers.find(t => t.id === id);
      const cardCount = tierToClear?.cards?.length || 0;
      
      console.log('🔍 clearTierCards called with id:', id)
      await tierAPI.clearTierCards(id);
      
      console.log('🔍 Tier cards cleared, about to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after clear tier cards:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiersFiltered(updatedTiers);
      
      // Add action to undo stack
      const newState = { tiers: updatedTiers, sourceCards: { ...sourceCards } };
      const description = `Clear ${cardCount} card${cardCount !== 1 ? 's' : ''} from ${tierToClear?.name || 'tier'}`;
      
      addAction(createAction(
        ACTION_TYPES.CLEAR_TIER,
        description,
        previousState,
        newState
      ));
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
      
      // Version history: Added source card
      try {
        const description = `Added source card '${newCard.text || 'Card'}'`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(tiers)),
          sourceCardsData: JSON.parse(JSON.stringify({
            competitors: updatedSourceCards.competitors || [],
            pages: updatedSourceCards.pages || [],
            personas: updatedSourceCards.personas || []
          }))
        });
      } catch (e) {
        console.warn('Failed to create version for createSourceCard:', e);
      }
      
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
      // Capture previous state for potential UI messaging (no local mutation yet)
      const prevSourceCards = {
        competitors: sourceCards.competitors || [],
        pages: sourceCards.pages || [],
        personas: sourceCards.personas || []
      };

      const response = await sourceCardAPI.updateSourceCard(id, cardData);
      const updatedCard = response.data.data || response.data;
      console.log('🔍 Source card updated:', updatedCard)

      // Reload source cards to preserve all fields (image, comments, etc.)
      console.log('🔍 About to reload source cards from API...')
      const sourceCardsResponse = await sourceCardAPI.getAllSourceCardsGrouped();
      const updatedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      console.log('🔍 Reloaded source cards from API:', updatedSourceCards)

      // If this update included an image change, add a one-time cache-buster to the updated item's image
      const cacheBuster = Date.now();
      const addBust = (url) => {
        if (!url) return url;
        // Do NOT append cache-buster to data URIs (e.g., base64 images)
        // Appending query params to data: URLs makes them invalid and triggers ERR_INVALID_URL
        if (typeof url === 'string' && url.startsWith('data:image')) return url;
        return url.includes('?') ? `${url}&v=${cacheBuster}` : `${url}?v=${cacheBuster}`;
      };
      const imageWasUpdated = Object.prototype.hasOwnProperty.call(cardData || {}, 'imageUrl') && cardData.imageUrl !== undefined;

      const nextSourceCards = {
        competitors: (updatedSourceCards.competitors || []).map(sc =>
          imageWasUpdated && sc.id === updatedCard.id ? { ...sc, imageUrl: addBust(sc.imageUrl) } : sc
        ),
        pages: (updatedSourceCards.pages || []).map(sc =>
          imageWasUpdated && sc.id === updatedCard.id ? { ...sc, imageUrl: addBust(sc.imageUrl) } : sc
        ),
        personas: (updatedSourceCards.personas || []).map(sc =>
          imageWasUpdated && sc.id === updatedCard.id ? { ...sc, imageUrl: addBust(sc.imageUrl) } : sc
        )
      };

      setSourceCards(nextSourceCards);

      // Also reload tiers so tier cards reflect the new source name/image immediately
      console.log('🔍 About to reload tiers from API after source update...')
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      // If image changed, ensure tier cards get the updated image from the source card
      const nextTiers = imageWasUpdated
        ? (Array.isArray(updatedTiers) ? updatedTiers.map(tier => ({
            ...tier,
            cards: (tier.cards || []).map(card => {
              if (card && card.text === updatedCard.text && card.type === updatedCard.type) {
                // Force tier cards to use the updated source card's image
                const sourceImageUrl = updatedCard.imageUrl;
                console.log('🔍 Syncing tier card image:', {
                  cardText: card.text,
                  currentImageUrl: card.imageUrl,
                  sourceImageUrl: sourceImageUrl,
                  willUpdate: !!sourceImageUrl
                });
                
                return sourceImageUrl 
                  ? { ...card, imageUrl: addBust(sourceImageUrl) }
                  : { ...card, imageUrl: null }; // Clear image if source has no image
              }
              return card;
            })
          })) : updatedTiers)
        : updatedTiers;

      setTiersFiltered(nextTiers);

    // Create a Version History entry when image was updated
    if (imageWasUpdated) {
      try {
        // Determine whether image was added/updated/removed based on previous value
        const prevAll = [
          ...(prevSourceCards.competitors || []),
          ...(prevSourceCards.pages || []),
          ...(prevSourceCards.personas || [])
        ];
        const prev = prevAll.find(c => c.id === id);
        const prevImage = prev?.imageUrl || null;
        const newImage = updatedCard?.imageUrl || null;
        let description = `Updated image for '${updatedCard?.text || 'Card'}'`;
        if (prevImage && !newImage) description = `Removed image for '${updatedCard?.text || 'Card'}'`;
        else if (!prevImage && newImage) description = `Added image for '${updatedCard?.text || 'Card'}'`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(nextTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(nextSourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for updateSourceCard (image change):', e);
      }
    }

    // Create a Version History entry when name was updated
    try {
      // Find previous card across groups by id
      const prevAll = [
        ...(prevSourceCards.competitors || []),
        ...(prevSourceCards.pages || []),
        ...(prevSourceCards.personas || [])
      ];
      const prev = prevAll.find(c => c.id === id);
      const prevName = prev?.text;
      const newName = updatedCard?.text;
      if (typeof prevName === 'string' && typeof newName === 'string' && prevName !== newName) {
        const description = `Renamed card '${prevName}' to '${newName}'`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(nextTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(nextSourceCards))
        });
      }
    } catch (e) {
      console.warn('Failed to create version for updateSourceCard (rename):', e);
    }

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
      // Get previous card for messaging
      const prev = sourceCards[sourceCategory]?.find(c => c.id === id);
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

      // Version history: Deleted source card
      try {
        const description = `Deleted source card '${prev?.text || 'Card'}'`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(tiers)),
          sourceCardsData: JSON.parse(JSON.stringify({
            competitors: updatedSourceCards.competitors || [],
            pages: updatedSourceCards.pages || [],
            personas: updatedSourceCards.personas || []
          }))
        });
      } catch (e) {
        console.warn('Failed to create version for deleteSourceCard:', e);
      }
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
      // Store previous state for undo (before API call)
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
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
      
      setTiersFiltered(updatedTiers);
      
      // Track action for undo/redo (only if not during undo/redo operation)
      if (!isPerformingAction) {
        const newState = { tiers: updatedTiers, sourceCards: { ...sourceCards } };
        const targetTier = updatedTiers.find(t => t.id === cardData.tierId);
        const description = `Added card "${newCard.text || 'Card'}" to tier ${targetTier?.name || 'tier'}`;
        
        addAction(createAction(
          ACTION_TYPES.ADD_CARD,
          description,
          previousState,
          newState
        ));
      }
      
      // Version history: Added card
      try {
        const targetTier = updatedTiers.find(t => t.id === cardData.tierId);
        const description = `Added card '${newCard.text || 'Card'}' to tier ${targetTier?.name || 'tier'}`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(updatedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for createCard:', e);
      }
      
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
      // Capture previous name before update for rename detection
      const prevCard = (tiers.flatMap(t => t.cards || [])).find(c => c.id === id);
      const prevName = prevCard?.text;
      const prevImage = prevCard?.imageUrl || null;
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
      
      setTiersFiltered(updatedTiers);
      
      // Update in source cards if it's a source card
      if (cardData.sourceCategory) {
        setSourceCards(prev => ({
          ...prev,
          [cardData.sourceCategory]: (prev[cardData.sourceCategory] || []).map(card =>
            card.id === id ? updatedCard : card
          )
        }));
      }
      
      // If name changed, create a Version History entry
      try {
        const newName = updatedCard?.text;
        if (typeof prevName === 'string' && typeof newName === 'string' && prevName !== newName) {
          const description = `Renamed card '${prevName}' to '${newName}'`;
          await createVersion({
            description,
            tiersData: JSON.parse(JSON.stringify(updatedTiers)),
            sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
          });
        }
      } catch (e) {
        console.warn('Failed to create version for updateCard (rename):', e);
      }

      // If image changed, create a Version History entry (added/updated/removed)
      try {
        const newImage = updatedCard?.imageUrl || null;
        if (prevImage !== newImage) {
          let description = null;
          if (prevImage && !newImage) description = `Removed image for '${updatedCard?.text || 'Card'}'`;
          else if (!prevImage && newImage) description = `Added image for '${updatedCard?.text || 'Card'}'`;
          else if (prevImage && newImage) description = `Updated image for '${updatedCard?.text || 'Card'}'`;
          if (description) {
            await createVersion({
              description,
              tiersData: JSON.parse(JSON.stringify(updatedTiers)),
              sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
            });
          }
        }
      } catch (e) {
        console.warn('Failed to create version for updateCard (image change):', e);
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
      // Store previous state for undo
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
      // Find the card before deletion for undo description
      const cardToDelete = tiers.flatMap(t => t.cards || []).find(c => c.id === id);
      const tierName = tiers.find(t => t.cards?.some(c => c.id === id))?.name || 'tier';
      
      await cardAPI.deleteCard(id);
      
      console.log('🔍 Card deleted, about to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after delete:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiersFiltered(updatedTiers);
      
      // Remove from source cards
      setSourceCards(prev => ({
        competitors: (prev.competitors || []).filter(card => card.id !== id),
        pages: (prev.pages || []).filter(card => card.id !== id),
        personas: (prev.personas || []).filter(card => card.id !== id)
      }));
      
      // Track action for undo/redo (only if not during undo/redo operation)
      if (!isPerformingAction) {
        const newState = { tiers: updatedTiers, sourceCards: { ...sourceCards } };
        const description = `Deleted card "${cardToDelete?.text || 'Card'}" from tier ${tierName}`;
        
        addAction(createAction(
          ACTION_TYPES.DELETE_CARD,
          description,
          previousState,
          newState
        ));
      }
      
      // Version history: Deleted card
      try {
        const description = `Deleted card '${cardToDelete?.text || 'Card'}' from tier ${tierName}`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(updatedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for deleteCard:', e);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete card');
      setError(errorMessage);
      throw err;
    }
  };

  const moveCard = async (id, moveData) => {
    try {
      // Store previous state for undo (before API call)
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
      const response = await cardAPI.moveCard(id, moveData);
      const updatedTiers = response.data.data || response.data;

      // Validate structure: must be an array of tiers each with cards array
      const isValid = Array.isArray(updatedTiers) && updatedTiers.every(t => t && Array.isArray(t.cards));
      if (!isValid) {
        console.error('Invalid tiers data received from moveCard API:', updatedTiers);
        setError('Failed to move card due to invalid server response. Refreshing board...');
        await loadInitialData();
        setTimeout(() => setError(null), 4000);
        return;
      }

      // Apply state
      setTiersFiltered(updatedTiers);

      // Track action for undo/redo (only if not during undo/redo operation)
      if (!isPerformingAction) {
        const newState = { tiers: updatedTiers, sourceCards: { ...sourceCards } };
        const card = updatedTiers.flatMap(t => t.cards || []).find(c => c.id === id);
        const targetTier = updatedTiers.find(t => t.id === moveData.targetTierId);
        // Find source tier in previous state
        const sourceTierPrev = previousState.tiers.find(t => (t.cards || []).some(c => c.id === id));
        const description = `Moved card "${card?.text || 'Card'}" from ${sourceTierPrev?.name || 'tier'} to ${targetTier?.name || 'tier'}`;

        addAction(createAction(
          ACTION_TYPES.MOVE_CARD,
          description,
          previousState,
          newState
        ));
      }
      
      // Version history: Moved card between tiers
      try {
        const card = updatedTiers.flatMap(t => t.cards || []).find(c => c.id === id);
        const targetTier = updatedTiers.find(t => t.id === moveData.targetTierId);
        const sourceTierPrev = previousState.tiers.find(t => (t.cards || []).some(c => c.id === id));
        const description = `Moved card '${card?.text || 'Card'}' from ${sourceTierPrev?.name || 'tier'} to ${targetTier?.name || 'tier'}`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(updatedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for moveCard:', e);
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
      // Capture original card and tier for description
      const originalTier = tiers.find(t => (t.cards || []).some(c => c.id === id));
      const originalCard = originalTier?.cards?.find(c => c.id === id);
      const response = await cardAPI.duplicateCard(id);
      const newCard = response.data.data || response.data;
      
      console.log('🔍 Card duplicated:', newCard)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we get the complete, up-to-date state from the server
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      
      console.log('🔍 Reloaded tiers from API after duplicate:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiersFiltered(updatedTiers);

      // Create a version entry after duplication
      try {
        const description = `Duplicated card "${originalCard?.text || 'Card'}" in tier "${originalTier?.name || 'tier'}"`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(updatedTiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
      } catch (e) {
        console.warn('Failed to create version for duplicateCard:', e);
      }

      return newCard;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to duplicate card');
      setError(errorMessage);
      throw err;
    }
  };

  const duplicateSourceCard = async (id) => {
    try {
      // Capture original source card and category for description
      const allSourceCardsBefore = {
        competitors: sourceCards.competitors || [],
        pages: sourceCards.pages || [],
        personas: sourceCards.personas || []
      };
      const originalCard = [
        ...allSourceCardsBefore.competitors,
        ...allSourceCardsBefore.pages,
        ...allSourceCardsBefore.personas
      ].find(c => c.id === id);
      const response = await sourceCardAPI.duplicateSourceCard(id);
      const newSourceCard = response.data.data || response.data;
      
      console.log('🔍 Source card duplicated:', newSourceCard)
      console.log('🔍 About to reload source cards from API...')
      
      // Reload the entire source cards data from API
      const sourceCardsResponse = await sourceCardAPI.getAllSourceCardsGrouped();
      const updatedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      
      console.log('🔍 Reloaded source cards from API after duplicate:', updatedSourceCards)
      
      setSourceCards({
        competitors: updatedSourceCards.competitors || [],
        pages: updatedSourceCards.pages || [],
        personas: updatedSourceCards.personas || []
      });

      // Create a version entry after duplication
      try {
        const description = `Duplicated source card "${originalCard?.text || 'Card'}" in ${originalCard?.sourceCategory || 'source'}`;
        await createVersion({
          description,
          tiersData: JSON.parse(JSON.stringify(tiers)),
          sourceCardsData: JSON.parse(JSON.stringify({
            competitors: updatedSourceCards.competitors || [],
            pages: updatedSourceCards.pages || [],
            personas: updatedSourceCards.personas || []
          }))
        });
      } catch (e) {
        console.warn('Failed to create version for duplicateSourceCard:', e);
      }

      return newSourceCard;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to duplicate source card');
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
      
      setTiersFiltered(updatedTiers);
      
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
      // If the card is a source card (in source area), use source card comments API
      const isSourceCard = !!commentData.card?.sourceCategory;
      let newComment;
      if (isSourceCard) {
        const response = await sourceCardAPI.addComment(commentData.card.id, commentData.text);
        newComment = response.data.data || response.data;
      } else {
        const response = await commentAPI.createComment(commentData);
        newComment = response.data.data || response.data;
      }
      
      console.log('🔍 Comment created:', newComment)
      console.log('🔍 About to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const tiersResponse = await tierAPI.getAllTiersWithCards();
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      const sourceCardsResponse = await sourceCardAPI.getAllSourceCardsGrouped();
      const updatedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      
      console.log('🔍 Reloaded tiers from API after create comment:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiersFiltered(updatedTiers);
      setSourceCards({
        competitors: updatedSourceCards.competitors || [],
        pages: updatedSourceCards.pages || [],
        personas: updatedSourceCards.personas || []
      });

      // If this was a source card comment, create version history entry and sync to tier cards
      if (isSourceCard) {
        try {
          const sourceCard = commentData.card;
          const description = `Added comment to '${sourceCard?.text || 'Card'}'`;
          await createVersion({
            description,
            tiersData: JSON.parse(JSON.stringify(updatedTiers)),
            sourceCardsData: JSON.parse(JSON.stringify({
              competitors: updatedSourceCards.competitors || [],
              pages: updatedSourceCards.pages || [],
              personas: updatedSourceCards.personas || []
            }))
          });
        } catch (e) {
          console.warn('Failed to create version for createComment (source card):', e);
        }
      } else {
        // Tier card comment
        try {
          const cardText = commentData?.card?.text || 'Card';
          const description = `Added comment to '${cardText}'`;
          await createVersion({
            description,
            tiersData: JSON.parse(JSON.stringify(updatedTiers)),
            sourceCardsData: JSON.parse(JSON.stringify({
              competitors: updatedSourceCards.competitors || [],
              pages: updatedSourceCards.pages || [],
              personas: updatedSourceCards.personas || []
            }))
          });
        } catch (e) {
          console.warn('Failed to create version for createComment (tier card):', e);
        }
      }
      
      return newComment;
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to create comment');
      setError(errorMessage);
      throw err;
    }
  };

  const deleteComment = async (id, cardId) => {
    try {
      // Take a snapshot of current tiers to reference card text after deletion
      const prevTiersSnapshot = JSON.parse(JSON.stringify(tiers || []));
      // Determine if this is a source card by searching current source cards
      const allSourceCards = [
        ...(sourceCards.competitors || []),
        ...(sourceCards.pages || []),
        ...(sourceCards.personas || [])
      ];
      const sourceCard = allSourceCards.find(c => c.id === cardId);
      if (sourceCard) {
        await sourceCardAPI.deleteComment(sourceCard.id, id);
      } else {
        await commentAPI.deleteComment(id);
      }
      
      console.log('🔍 Comment deleted, about to reload tiers from API...')
      
      // Instead of updating local state, reload the entire tiers data from API
      // This ensures we always have the latest data and avoids race conditions
      const [tiersResponse, sourceCardsResponse] = await Promise.all([
        tierAPI.getAllTiersWithCards(),
        sourceCardAPI.getAllSourceCardsGrouped()
      ]);
      const updatedTiers = tiersResponse.data.data || tiersResponse.data;
      const updatedSourceCards = sourceCardsResponse.data.data || sourceCardsResponse.data;
      
      console.log('🔍 Reloaded tiers from API after delete comment:', updatedTiers)
      console.log('🔍 Reloaded tiers length:', updatedTiers?.length)
      
      setTiersFiltered(updatedTiers);
      setSourceCards({
        competitors: updatedSourceCards.competitors || [],
        pages: updatedSourceCards.pages || [],
        personas: updatedSourceCards.personas || []
      });

      // If this was a source card comment, create version history entry
      if (sourceCard) {
        try {
          const description = `Deleted comment from '${sourceCard?.text || 'Card'}'`;
          await createVersion({
            description,
            tiersData: JSON.parse(JSON.stringify(updatedTiers)),
            sourceCardsData: JSON.parse(JSON.stringify({
              competitors: updatedSourceCards.competitors || [],
              pages: updatedSourceCards.pages || [],
              personas: updatedSourceCards.personas || []
            }))
          });
        } catch (e) {
          console.warn('Failed to create version for deleteComment (source card):', e);
        }
      } else {
        // Tier card comment deletion
        try {
          // Find the tier card by id in previous tiers snapshot (before reload), fallback to updated
          const prevCard = prevTiersSnapshot.flatMap(t => t.cards || []).find(c => c.id === cardId)
            || updatedTiers.flatMap(t => t.cards || []).find(c => c.id === cardId);
          const description = `Deleted comment from '${prevCard?.text || 'Card'}'`;
          await createVersion({
            description,
            tiersData: JSON.parse(JSON.stringify(updatedTiers)),
            sourceCardsData: JSON.parse(JSON.stringify({
              competitors: updatedSourceCards.competitors || [],
              pages: updatedSourceCards.pages || [],
              personas: updatedSourceCards.personas || []
            }))
          });
        } catch (e) {
          console.warn('Failed to create version for deleteComment (tier card):', e);
        }
      }
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete comment');
      setError(errorMessage);
      throw err;
    }
  };

  // Version operations section - createVersion moved earlier to fix hoisting

  const deleteVersion = async (id) => {
    try {
      await versionAPI.deleteVersion(id);
      setVersionHistory(prev => {
        const updatedHistory = prev.filter(v => v.id !== id);
        // Recalculate current version index against the updated list
        updateCurrentVersionIndex(updatedHistory, tiers, sourceCards);
        return updatedHistory;
      });
    } catch (err) {
      const errorMessage = handleAPIError(err, 'Failed to delete version');
      setError(errorMessage);
      throw err;
    }
  };

  const restoreVersion = async (id) => {
    try {
      // Suppress autosave once after restoring to avoid immediately saving the restored snapshot
      suppressNextAutosaveRef.current = true;
      const response = await versionAPI.restoreVersion(id);
      const restoredVersion = response.data.data || response.data;
      
      // Find the restored version in the version history and set it as current
      const versionIndex = versionHistory.findIndex(v => v.id === id);
      if (versionIndex !== -1) {
        setCurrentVersionIndex(versionIndex);
      }
      
      // The backend restores data to the database but returns the version object
      // We need to reload the data to get the restored state
      setToast({ type: 'success', message: 'Version restored', duration: 3000 });
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
      // Store previous state for undo
      const previousState = { tiers: [...tiers], sourceCards: { ...sourceCards } };
      
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
          setTiersFiltered(sanitizedTiers);
          
          // Add action to undo stack
          const newState = { tiers: sanitizedTiers, sourceCards: { ...sourceCards } };
          const targetTier = tiers.find(t => t.id === importData.targetTierId);
          const cardCount = importData.cardIds?.length || 0;
          const description = `Import ${cardCount} card${cardCount !== 1 ? 's' : ''} to ${targetTier?.name || 'tier'}`;
          
          addAction(createAction(
            ACTION_TYPES.IMPORT_CARDS,
            description,
            previousState,
            newState
          ));
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
        const versionCards = Array.isArray(versionTier.cards) ? versionTier.cards : [];
        const currentCards = Array.isArray(currentTier.cards) ? currentTier.cards : [];

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

          // Compare comments on the card (ensure comment changes affect version equality)
          const versionComments = Array.isArray(versionCard.comments) ? versionCard.comments : [];
          const currentComments = Array.isArray(currentCard.comments) ? currentCard.comments : [];

          if (versionComments.length !== currentComments.length) {
            return false;
          }

          for (let k = 0; k < versionComments.length; k++) {
            const vCom = versionComments[k] || {};
            const cCom = currentComments[k] || {};
            if (vCom.id !== cCom.id || vCom.text !== cCom.text) {
              return false;
            }
          }
        }
      }

      // Compare source cards
      const sourceCategories = ['competitors', 'pages', 'personas'];
      for (const category of sourceCategories) {
        const versionCategoryCards = (versionSourceCards && versionSourceCards[category]) ? versionSourceCards[category] : [];
        const currentCategoryCards = (currentSourceCards && currentSourceCards[category]) ? currentSourceCards[category] : [];

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

          // Compare comments on source cards (if present)
          const vComms = Array.isArray(versionCard.comments) ? versionCard.comments : [];
          const cComms = Array.isArray(currentCard.comments) ? currentCard.comments : [];
          if (vComms.length !== cComms.length) {
            return false;
          }
          for (let k = 0; k < vComms.length; k++) {
            const vCom = vComms[k] || {};
            const cCom = cComms[k] || {};
            if (vCom.id !== cCom.id || vCom.text !== cCom.text) {
              return false;
            }
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
  // Note: expects the same ordering as `versionHistory` (newest-first)
  const updateCurrentVersionIndex = (versionsInUIOrder, currentTiers, currentSourceCards) => {
    if (!Array.isArray(versionsInUIOrder) || versionsInUIOrder.length === 0) {
      setCurrentVersionIndex(-1);
      return;
    }
    // Iterate newest-first to find the first match (index 0 is latest)
    for (let i = 0; i < versionsInUIOrder.length; i++) {
      if (isCurrentVersion(versionsInUIOrder[i], currentTiers, currentSourceCards)) {
        setCurrentVersionIndex(i);
        return;
      }
    }
    // If no version matches current board state, default to latest so the UI always highlights something
    setCurrentVersionIndex(0);
  };

  // Compute a simple hash of current state to deduplicate autosaves
  const computeStateHash = useCallback((tiersState, sourceCardsState) => {
    try {
      return JSON.stringify({ t: tiersState, s: sourceCardsState });
    } catch (e) {
      return `${Date.now()}`; // fallback unique value
    }
  }, []);

  // Update current version index whenever board state changes (but not during manual undo/redo)
  useEffect(() => {
    if (suppressVersionIndexUpdateRef.current) {
      suppressVersionIndexUpdateRef.current = false;
      return;
    }
    if (versionHistory.length > 0 && tiers.length > 0) {
      updateCurrentVersionIndex(versionHistory, tiers, sourceCards);
    }
  }, [tiers, sourceCards, versionHistory]);

  // Debounced autosave effect
  useEffect(() => {
    // Skip during initial data load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      // Initialize last saved hash to the currently loaded state to avoid immediate autosave
      lastSavedHashRef.current = computeStateHash(tiers, sourceCards);
      return;
    }

    // Skip while bulk loading flags are active
    if (loading.tiers || loading.sourceCards || loading.versions) {
      return;
    }

    // Optionally suppress one autosave (e.g., right after restore)
    if (suppressNextAutosaveRef.current) {
      suppressNextAutosaveRef.current = false;
      // Refresh the lastSavedHash to the restored state
      lastSavedHashRef.current = computeStateHash(tiers, sourceCards);
      return;
    }

    // Debounce rapid changes
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(async () => {
      const currentHash = computeStateHash(tiers, sourceCards);
      if (currentHash === lastSavedHashRef.current) {
        return; // No meaningful change
      }
      try {
        const baseDescription = lastActionDescriptionRef.current?.trim();
        if (!baseDescription || baseDescription.toLowerCase() === 'board updated') {
          // Skip autosave when description is generic; prevents noisy entries
          lastSavedHashRef.current = currentHash;
          return;
        }
        await createVersion({
          description: baseDescription,
          tiersData: JSON.parse(JSON.stringify(tiers)),
          sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
        });
        lastSavedHashRef.current = currentHash;
        // Show autosave toast
        setToast({ type: 'success', message: 'Changes saved', duration: 3000 });
      } catch (e) {
        // Non-fatal; autosave failures should not break UX
        console.error('Autosave failed:', e);
        setToast({ type: 'error', message: 'Failed to save changes', duration: 3000 });
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [tiers, sourceCards, loading.tiers, loading.sourceCards, loading.versions]);

  // Clear toast function
  const clearToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  return {
    // Data
    tiers,
    sourceCards,
    versionHistory,
    currentVersionIndex,
    toast,
    
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
    duplicateSourceCard,
    toggleCardHidden,
    
    // Comment operations
    createComment,
    deleteComment,
    
    // Version operations
    createVersion,
    restoreVersion,
    deleteVersion,
    setManualVersionIndex,
    
    // Import operations
    importCardsToTier,
    
    // Utility functions
    clearError,
    refreshData,
    setNextAutosaveDescription,
    clearToast,
    
    // Undo/Redo functionality
    handleUndo,
    handleRedo,
    canUndo: currentVersionIndex < versionHistory.length - 1,
    canRedo: currentVersionIndex > 0,
    getNextUndoDescription,
    getNextRedoDescription,
    isPerformingAction,
    undoStackLength,
    redoStackLength,
    clearHistory,
  };
}; 