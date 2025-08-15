import React, { useEffect } from 'react';

const UndoRedoButtons = ({ 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo, 
  undoDescription, 
  redoDescription 
}) => {
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if we're in an input field or textarea
      const isInInput = event.target.tagName === 'INPUT' || 
                       event.target.tagName === 'TEXTAREA' || 
                       event.target.contentEditable === 'true';
      
      if (isInInput) return;

      // Ctrl+Z for Undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          onUndo();
        }
      }
      
      // Ctrl+Y or Ctrl+Shift+Z for Redo
      if ((event.ctrlKey && event.key === 'y') || 
          (event.ctrlKey && event.shiftKey && event.key === 'Z')) {
        event.preventDefault();
        if (canRedo) {
          onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <div className="flex gap-2">
      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200
          ${canUndo 
            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
        title={canUndo ? `Undo: ${undoDescription || 'Previous action'}` : 'Nothing to undo'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Undo
        <span className="text-xs opacity-75">Ctrl+Z</span>
      </button>

      {/* Redo Button */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200
          ${canRedo 
            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
        title={canRedo ? `Redo: ${redoDescription || 'Next action'}` : 'Nothing to redo'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
        Redo
        <span className="text-xs opacity-75">Ctrl+Y</span>
      </button>
    </div>
  );
};

export default UndoRedoButtons; 