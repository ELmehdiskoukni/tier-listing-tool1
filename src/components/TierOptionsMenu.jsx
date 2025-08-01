import React, { useState, useRef, useEffect } from 'react'

const TierOptionsMenu = ({ 
  isOpen, 
  onClose, 
  tierName, 
  tierColor,
  onEditName,
  onChangeColor, 
  onDuplicate, 
  onDelete,
  position 
}) => {
  const menuRef = useRef(null)

  // Available tier colors
  const colors = [
    { name: 'Default', value: 'bg-gray-300', preview: 'bg-gray-300' },
    { name: 'Yellow', value: 'bg-yellow-200', preview: 'bg-yellow-200' },
    { name: 'Green', value: 'bg-green-200', preview: 'bg-green-200' },
    { name: 'Blue', value: 'bg-blue-200', preview: 'bg-blue-200' },
    { name: 'Red', value: 'bg-red-200', preview: 'bg-red-200' },
    { name: 'Purple', value: 'bg-purple-200', preview: 'bg-purple-200' },
    { name: 'Orange', value: 'bg-orange-200', preview: 'bg-orange-200' },
    { name: 'Pink', value: 'bg-pink-200', preview: 'bg-pink-200' }
  ]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Adjust position to prevent menu from going off-screen
  const adjustedPosition = {
    top: Math.max(10, position?.top || 0),
    right: Math.max(10, position?.right || 0)
  }

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-[99999999999]"
      style={{
        top: adjustedPosition.top,
        right: adjustedPosition.right,
      }}
    >
      {/* Edit Name */}
      <button
        onClick={() => {
          onEditName()
          onClose()
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Name
      </button>

      {/* Color Options */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="text-xs font-medium text-gray-500 mb-2">Highlight Color</div>
        <div className="grid grid-cols-4 gap-1">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                onChangeColor(color.value)
                onClose()
              }}
              className={`
                w-8 h-6 rounded border-2 transition-all duration-200
                ${tierColor === color.value 
                  ? 'border-gray-800 ring-2 ring-blue-500' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${color.preview}
              `}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Duplicate */}
      <button
        onClick={() => {
          onDuplicate()
          onClose()
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 border-t border-gray-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Duplicate
      </button>

      {/* Delete */}
      <button
        onClick={() => {
          onDelete()
          onClose()
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  )
}

export default TierOptionsMenu