import { useState, useCallback, useRef } from 'react';

// Action types for tracking user actions
export const ACTION_TYPES = {
  MOVE_CARD: 'MOVE_CARD',
  ADD_CARD: 'ADD_CARD',
  DELETE_CARD: 'DELETE_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  DUPLICATE_CARD: 'DUPLICATE_CARD',
  TOGGLE_CARD_HIDDEN: 'TOGGLE_CARD_HIDDEN',
  ADD_TIER: 'ADD_TIER',
  DELETE_TIER: 'DELETE_TIER',
  UPDATE_TIER: 'UPDATE_TIER',
  MOVE_TIER: 'MOVE_TIER',
  DUPLICATE_TIER: 'DUPLICATE_TIER',
  IMPORT_CARDS: 'IMPORT_CARDS',
  CLEAR_TIER: 'CLEAR_TIER',
  ADD_SOURCE_CARD: 'ADD_SOURCE_CARD',
  DELETE_SOURCE_CARD: 'DELETE_SOURCE_CARD',
  UPDATE_SOURCE_CARD: 'UPDATE_SOURCE_CARD',
  ADD_COMMENT: 'ADD_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
  REMOVE_IMAGE: 'REMOVE_IMAGE',
  CHANGE_IMAGE: 'CHANGE_IMAGE',
  PICK_PERSONA: 'PICK_PERSONA'
};

// Maximum number of actions to keep in history
const MAX_HISTORY_SIZE = 30;
const COALESCE_WINDOW_MS = 2000; // 2 seconds

export const useUndoRedo = () => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Ref to track if we're currently performing an undo/redo operation
  const isUndoRedoInProgress = useRef(false);
  const lastPushTimestampRef = useRef(0);
 // Flag to track if an action was just undone - used to detect new actions after undo
 const actionJustUndone = useRef(false);

  // Create a deep copy of the current state
  const createStateSnapshot = useCallback((tiers, sourceCards) => {
    try {
      return {
        tiers: JSON.parse(JSON.stringify(tiers)),
        sourceCards: JSON.parse(JSON.stringify(sourceCards)),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error creating state snapshot:', error);
      return null;
    }
  }, []);

    // Add an action to the undo stack
    const addAction = useCallback((action) => {
      console.log('🔄 Adding action to undo stack:', action?.type, action?.description);
    
      if (isUndoRedoInProgress.current || isPerformingAction) {
        console.log('🔄 Skipping action - operation in progress');
        return;
      }
      if (!action || !action.previousState || !action.newState) {
        console.warn('🔄 Invalid action data, skipping undo/redo tracking');
        return;
      }
    
      // If a new action occurs after undo, we branch history: clear redo
      if (actionJustUndone.current) {
        if (redoStack.length > 0) {
          setRedoStack([]);
        }
        actionJustUndone.current = false; // Important even when redoStack is already empty
      }
    
      setUndoStack(prevStack => {
        const now = Date.now();
        const last = prevStack[prevStack.length - 1];
        let newStack = [...prevStack];
    
        if (last && last.type === action.type && now - (last.timestamp || 0) <= COALESCE_WINDOW_MS) {
          newStack[newStack.length - 1] = { ...action, timestamp: now };
        } else {
          newStack.push({ ...action, timestamp: now });
        }
    
        if (newStack.length > MAX_HISTORY_SIZE) {
          newStack = newStack.slice(-MAX_HISTORY_SIZE);
        }
        lastPushTimestampRef.current = now;
        return newStack;
      });
    }, [isPerformingAction, redoStack]);

  // Undo the last action
  const undo = useCallback(() => {
    console.log('🔄 Undo called, stack length:', undoStack.length);
    if (undoStack.length === 0) {
      console.log('🔄 No actions to undo');
      return null;
    }

    setIsPerformingAction(true);
    isUndoRedoInProgress.current = true;

    const lastAction = undoStack[undoStack.length - 1];
    console.log('🔄 Undoing action:', lastAction?.type, lastAction?.description);
    
    setUndoStack(prevStack => prevStack.slice(0, -1));
    setRedoStack(prevStack => [...prevStack, lastAction]);
    
    // Set flag that an action was just undone - this helps track when new actions occur after undo
    actionJustUndone.current = true;

    setIsPerformingAction(false);
    isUndoRedoInProgress.current = false;

    return lastAction;
  }, [undoStack]);

  // Redo the last undone action
  const redo = useCallback(() => {
    console.log('🔄 Redo called, stack length:', redoStack.length);
    if (redoStack.length === 0) {
      console.log('🔄 No actions to redo');
      return null;
    }

    setIsPerformingAction(true);
    isUndoRedoInProgress.current = true;

    const lastRedoAction = redoStack[redoStack.length - 1];
    console.log('🔄 Redoing action:', lastRedoAction?.type, lastRedoAction?.description);
    
    setRedoStack(prevStack => prevStack.slice(0, -1));
    setUndoStack(prevStack => [...prevStack, lastRedoAction]);
    
    // Reset the undo flag since we're not undoing but redoing
    actionJustUndone.current = false;

    setIsPerformingAction(false);
    isUndoRedoInProgress.current = false;

    return lastRedoAction;
  }, [redoStack]);

  // Clear all history
  const clearHistory = useCallback(() => {
    console.log('🔄 Clearing undo/redo history');
    setUndoStack([]);
    setRedoStack([]);
    actionJustUndone.current = false;
  }, []);

  // Check if undo is available
  const canUndo = undoStack.length > 0;
  
  // Check if redo is available
  const canRedo = redoStack.length > 0;

  // Get the description of the next undo action
  const getNextUndoDescription = useCallback(() => {
    if (undoStack.length === 0) return null;
    const lastAction = undoStack[undoStack.length - 1];
    return lastAction.description;
  }, [undoStack]);

  // Get the description of the next redo action
  const getNextRedoDescription = useCallback(() => {
    if (redoStack.length === 0) return null;
    const lastAction = redoStack[redoStack.length - 1];
    return lastAction.description;
  }, [redoStack]);

  return {
    addAction,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    getNextUndoDescription,
    getNextRedoDescription,
    isPerformingAction,
    undoStackLength: undoStack.length,
    redoStackLength: redoStack.length
  };
};