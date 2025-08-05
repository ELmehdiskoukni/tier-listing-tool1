import React from 'react'

const Card = ({ card, onDragStart, onDragEnd, isDragging, onRightClick, isDeletedSource = false }) => {
  // Define card styles based on type - NO ICONS, but support images
  const getCardStyle = (type) => {
    switch (type) {
      case 'image':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      case 'text':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      case 'page':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'personas':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'competitor':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      // Legacy support for old card types (also no icons)
      case 'sitemaps-page':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'competitor-text':
      case 'competitor-img':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'persona':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-white border-gray-300 text-gray-800'
    }
  }

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card))
    e.dataTransfer.effectAllowed = 'move'
    
    if (onDragStart) {
      onDragStart(card)
    }
  }

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(card)
    }
  }

  const handleRightClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onRightClick) {
      onRightClick(card, { x: e.clientX, y: e.clientY })
    }
  }

  // Check if card has an image
  const hasImage = (card.imageUrl && card.imageUrl !== null) || (card.image && card.image !== null)
  const isImageCard = card.subtype === 'image' && hasImage
  const isHidden = card.hidden

  return (
    <div
      draggable={!isHidden && !isDeletedSource}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={handleRightClick}
      className={`
        border rounded-md text-sm font-medium cursor-grab
        hover:shadow-md transition-all duration-200
        min-w-fit select-none relative
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
        ${isHidden ? 'opacity-40 grayscale' : ''}
        ${isDeletedSource ? 'opacity-60 grayscale bg-gray-200 border-gray-400 cursor-not-allowed' : ''}
        ${isImageCard ? 'p-1' : 'px-3 py-2'}
        ${isDeletedSource ? 'bg-gray-200 border-gray-400' : getCardStyle(card.type)}
      `}
      title={isDeletedSource 
        ? `This item was deleted from the source area. Original: ${card.text} (${card.type})` 
        : `${card.type}: ${card.text} ${isHidden ? '(hidden)' : ''} (right-click for options)`
      }
    >
      {/* Comment indicator */}
      {card.comments && card.comments.length > 0 && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">{card.comments.length}</span>
        </div>
      )}

      {/* Deleted source indicator */}
      {isDeletedSource && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      )}

      {isImageCard && hasImage ? (
        // Image card with actual image
        <div className="flex flex-col items-center gap-1">
          <img 
            src={card.imageUrl || card.image} 
            alt={card.text}
            className={`w-12 h-12 object-cover rounded ${isDeletedSource ? 'opacity-50' : ''}`}
            onError={(e) => {
              // Fallback to text if image fails to load
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <span 
            className="text-xs text-center leading-tight px-1 hidden"
            style={{ display: 'none' }}
          >
            {isDeletedSource ? 'This item is deleted' : card.text}
          </span>
          <span className={`text-xs text-center leading-tight px-1 ${isDeletedSource ? 'text-gray-500 italic' : ''}`}>
            {isDeletedSource ? 'This item is deleted' : card.text}
          </span>
        </div>
      ) : (
        // Text card or image card without image
        <span className={isDeletedSource ? 'text-gray-500 italic line-through' : ''}>
          {isDeletedSource ? 'This item is deleted' : card.text}
        </span>
      )}
    </div>
  )
}

export default Card