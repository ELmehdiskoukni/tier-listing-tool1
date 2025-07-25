import React from 'react'

const Card = ({ card, onDragStart, onDragEnd, isDragging }) => {
  // Define card styles based on type - ABSOLUTELY NO ICONS
  const getCardStyle = (type) => {
    switch (type) {
      case 'image':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      case 'text':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      case 'sitemaps-page':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'personas':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'competitor':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      // Legacy support for old card types (also no icons)
      case 'competitor-text':
      case 'competitor-img':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'persona':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'page':
        return 'bg-green-100 border-green-300 text-green-800'
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

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        px-3 py-2 border rounded-md text-sm font-medium cursor-grab
        hover:shadow-md transition-all duration-200
        min-w-fit select-none
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
        ${getCardStyle(card.type)}
      `}
      title={`${card.type}: ${card.text} (drag to move)`}
    >
      {card.text}
    </div>
  )
}

export default Card