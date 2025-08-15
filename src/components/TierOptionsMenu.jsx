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
  position,
  canDelete = true // New prop to control delete option visibility
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

  // Calculate smart positioning to keep menu anchored to the clicked button
  const calculateSmartPosition = () => {
    if (!position) return { top: 0, left: 0, positionAbove: false }

    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const menuWidth = 192 // w-48 = 192px
    const padding = 10

    // Determine menu height using measurement if available to be more accurate
    const measuredHeight = menuRef.current ? menuRef.current.offsetHeight : 280

    // Reconstruct the trigger rect using initial scroll offsets to anchor to the original button
    const initialScrollX = position.initialScrollX || 0
    const initialScrollY = position.initialScrollY || 0
    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY

    // Adjust top/left by scroll delta to keep anchored to the same button as the user scrolls
    const deltaX = currentScrollX - initialScrollX
    const deltaY = currentScrollY - initialScrollY

    const triggerTop = (position.buttonBottom ?? position.top) + deltaY
    const triggerLeft = (position.buttonLeft ?? (viewportWidth - position.right - menuWidth)) + deltaX

    // Decide above/below
    const spaceBelow = viewportHeight - (position.buttonBottom ?? position.top)
    const spaceAbove = (position.buttonTop ?? position.top)
    const shouldPositionAbove = spaceBelow < measuredHeight && spaceAbove > measuredHeight

    let top = shouldPositionAbove
      ? (position.buttonTop ?? triggerTop) - measuredHeight - 5 + deltaY
      : triggerTop + 5

    // Prefer aligning right edge of menu with the button's right edge so it feels attached
    let left = (position.buttonRight ?? (triggerLeft + menuWidth)) - menuWidth + deltaX

    // Clamp within viewport
    const minLeft = padding
    const maxLeft = viewportWidth - menuWidth - padding
    if (left < minLeft) left = minLeft
    if (left > maxLeft) left = Math.max(maxLeft, minLeft)

    // Also clamp vertical into viewport
    const minTop = padding
    const maxTop = viewportHeight - measuredHeight - padding
    if (top < minTop) top = minTop
    if (top > maxTop) top = Math.max(maxTop, minTop)

    return { top, left, positionAbove: shouldPositionAbove }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const smartPosition = calculateSmartPosition()

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl py-2 w-48 z-[99999999999] transform transition-all duration-200 ease-out"
      style={{
        top: smartPosition.top,
        left: smartPosition.left,
        maxHeight: 'calc(100vh - 20px)', // Ensure it doesn't exceed viewport
        overflowY: 'auto' // Add scroll if needed
      }}
    >
      {/* Position indicator arrow */}
      {smartPosition.positionAbove && (
        <div 
          className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-200"
          style={{ bottom: '-4px', left: '16px' }}
        />
      )}
      {!smartPosition.positionAbove && (
        <div 
          className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"
          style={{ top: '-4px', left: '16px' }}
        />
      )}

      {/* Edit Name */}
      <button
        onClick={() => {
          onEditName()
          onClose()
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors duration-150"
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
                w-8 h-6 rounded border-2 transition-all duration-200 hover:scale-110
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
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 border-t border-gray-100 transition-colors duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Duplicate
      </button>

      {/* Delete */}
      <button
        onClick={() => {
          if (canDelete) {
            onDelete()
          }
          onClose()
        }}
        disabled={!canDelete}
        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 border-t border-gray-100 transition-colors duration-150 ${
          canDelete 
            ? 'text-red-600 hover:bg-red-50 cursor-pointer' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title={!canDelete ? 'Cannot delete tier. Your Tier Listing board must have at least 2 tiers.' : 'Delete tier'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
        {!canDelete && (
          <span className="text-xs text-gray-500 ml-auto">(Min 2 tiers required)</span>
        )}
      </button>
    </div>
  )
}

export default TierOptionsMenu