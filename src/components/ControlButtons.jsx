import React from 'react'

const ControlButtons = ({ isFirst, isLast, onMoveTierUp, onMoveTierDown }) => {
  return (
    <div className="flex flex-col gap-1">
      {/* Move Up Button */}
      <button
        onClick={onMoveTierUp}
        disabled={isFirst}
        className={`
          w-6 h-6 rounded flex items-center justify-center text-xs transition-colors duration-200
          ${isFirst 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }
        `}
        title="Move tier up"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Move Down Button */}
      <button
        onClick={onMoveTierDown}
        disabled={isLast}
        className={`
          w-6 h-6 rounded flex items-center justify-center text-xs transition-colors duration-200
          ${isLast 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }
        `}
        title="Move tier down"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}

export default ControlButtons