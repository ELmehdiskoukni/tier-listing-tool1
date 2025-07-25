import React, { useRef, useState } from 'react'
import Card from './Card'
import ControlButtons from './ControlButtons'

const TierRow = ({ 
  tier, 
  isFirst, 
  isLast, 
  onMoveTierUp, 
  onMoveTierDown, 
  onAddCard, 
  onOpenOptionsMenu,
  onOpenOptions,
  onMoveCard,
  draggedCard,
  onDragStart,
  onDragEnd,
  onAddTierBelow // New prop for adding tier
}) => {
  const optionsButtonRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverPosition, setDragOverPosition] = useState(null) // 'start', 'middle', 'end'
  const [isRowHovered, setIsRowHovered] = useState(false)

  const handleOptionsClick = () => {
    if (optionsButtonRef.current) {
      const rect = optionsButtonRef.current.getBoundingClientRect()
      const position = {
        top: rect.bottom + 5,
        right: window.innerWidth - rect.right
      }
      onOpenOptionsMenu(position)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault() // CRITICAL: This allows the drop event to fire
    e.dataTransfer.dropEffect = 'move'
    
    if (!isDragOver) {
      setIsDragOver(true)
    }

    // Determine where in the tier the user is hovering
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    
    if (x < width * 0.33) {
      setDragOverPosition('start')
    } else if (x > width * 0.67) {
      setDragOverPosition('end')
    } else {
      setDragOverPosition('middle')
    }
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    // Only hide the drop indicator if we're leaving the tier entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
      setDragOverPosition(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragOverPosition(null)

    try {
      const cardData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      if (cardData && onMoveCard) {
        // Determine the drop position based on where the user dropped
        let dropPosition = 'end' // default to end
        
        if (dragOverPosition === 'start') {
          dropPosition = 'start'
        } else if (dragOverPosition === 'middle') {
          dropPosition = 'middle'
        }

        onMoveCard(cardData, tier.id, dropPosition)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  // Get drop zone indicator classes
  const getDropZoneClasses = () => {
    if (!isDragOver || !draggedCard) return ''
    
    let baseClasses = 'ring-2 ring-blue-400 bg-blue-50'
    
    if (dragOverPosition === 'start') {
      baseClasses += ' ring-offset-2 ring-offset-green-200'
    } else if (dragOverPosition === 'end') {
      baseClasses += ' ring-offset-2 ring-offset-purple-200'
    }
    
    return baseClasses
  }
  return (
    <div 
      className="border border-gray-300 rounded-lg overflow-hidden"
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      <div className="flex items-stretch min-h-[80px]">
        {/* Left side - Tier controls */}
        <div className="flex">
          {/* Move tier up/down buttons */}
          <div className="flex flex-col items-center justify-center bg-gray-50 px-3 border-r border-gray-300">
            <ControlButtons
              isFirst={isFirst}
              isLast={isLast}
              onMoveTierUp={onMoveTierUp}
              onMoveTierDown={onMoveTierDown}
            />
          </div>

          {/* Add tier button - shows on hover */}
          <div className={`
            flex flex-col items-center justify-center bg-gray-50 px-2 border-r border-gray-300 transition-all duration-200
            ${isRowHovered ? 'opacity-100 w-10' : 'opacity-0 w-0 px-0'}
          `}>
            {isRowHovered && (
              <button
                onClick={onAddTierBelow}
                className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                title="Add tier below"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Tier label */}
          <div className={`flex items-center justify-center w-16 ${tier.color} border-r border-gray-300`}>
            <span className="text-xl font-bold text-gray-800">
              {tier.name}
            </span>
          </div>
        </div>

        {/* Main content area - Cards */}
        <div 
          className={`
            flex-1 flex items-center p-4 bg-gray-50 min-h-[80px] transition-all duration-200
            ${getDropZoneClasses()}
          `}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center gap-3 flex-wrap w-full">
            {/* Drop indicator at start */}
            {isDragOver && dragOverPosition === 'start' && (
              <div className="w-1 h-12 bg-blue-500 rounded-full animate-pulse" />
            )}
            
            {/* Render existing cards */}
            {tier.cards.map(card => (
              <Card 
                key={card.id} 
                card={card}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggedCard?.id === card.id}
              />
            ))}
            
            {/* Drop indicator in middle/end */}
            {isDragOver && (dragOverPosition === 'middle' || dragOverPosition === 'end') && (
              <div className="w-1 h-12 bg-blue-500 rounded-full animate-pulse" />
            )}
            
            {/* Add card button */}
            <button
              onClick={onAddCard}
              className="w-12 h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-md flex items-center justify-center transition-colors duration-200 ml-auto"
              title="Add new card"
            >
              <span className="text-xl font-bold">+</span>
            </button>
          </div>
        </div>

        {/* Right side - Tier options */}
        <div className="flex items-center justify-center bg-gray-50 px-3 border-l border-gray-300">
          <button
            ref={optionsButtonRef}
            onClick={handleOptionsClick}
            className="w-8 h-8 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            title="Tier options"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TierRow