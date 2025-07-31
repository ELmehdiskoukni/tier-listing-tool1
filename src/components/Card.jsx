import React from 'react'

const Card = ({ card, onDragStart, onDragEnd, isDragging, onRightClick }) => {
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
  const hasImage = card.imageUrl || card.image
  const isImageCard = card.subtype === 'image' || hasImage
  const isHidden = card.hidden

  return (
    <div
      draggable={!isHidden}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={handleRightClick}
      className={`
        border rounded-md text-sm font-medium cursor-grab
        hover:shadow-md transition-all duration-200
        min-w-fit select-none relative
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
        ${isHidden ? 'opacity-40 grayscale' : ''}
        ${isImageCard ? 'p-1' : 'px-3 py-2'}
        ${getCardStyle(card.type)}
      `}
      title={`${card.type}: ${card.text} ${isHidden ? '(hidden)' : ''} (right-click for options)`}
    >
      {/* Comment indicator */}
      {card.comments && card.comments.length > 0 && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">{card.comments.length}</span>
        </div>
      )}

      {isImageCard && hasImage ? (
        // Image card with actual image
        <div className="flex flex-col items-center gap-1">
          <img 
            src={card.imageUrl || card.image} 
            alt={card.text}
            className="w-12 h-12 object-cover rounded"
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
            {card.text}
          </span>
          <span className="text-xs text-center leading-tight px-1">
            {card.text}
          </span>
        </div>
      ) : (
        // Text card or image card without image
        <span>{card.text}</span>
      )}
    </div>
  )
}

export default Card