import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Card from './Card'
import ControlButtons from './ControlButtons'

const TierRow = ({ 
  tier = {}, 
  isFirst = false, 
  isLast = false, 
  onMoveTierUp = () => {}, 
  onMoveTierDown = () => {}, 
  onAddCard = () => {}, 
  onImportCards = () => {},
  onOpenOptionsMenu = () => {},
  onOpenOptions = () => {},
  onMoveCard = () => {},
  draggedCard = null,
  onDragStart = () => {},
  onDragEnd = () => {},
  onAddTierBelow = () => {},
  onCardRightClick = () => {}, // Make sure this prop is here
  isCardFromDeletedSource = () => false // New prop for checking deleted sources
}) => {
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [isDropdownReady, setIsDropdownReady] = useState(false)
  const optionsButtonRef = useRef(null)
  const dropdownRef = useRef(null)
  const dropdownMenuRef = useRef(null) // New ref for the portal dropdown
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverPosition, setDragOverPosition] = useState(null) // 'start', 'middle', 'end'
  const [isRowHovered, setIsRowHovered] = useState(false)

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the button and the dropdown menu
      const isOutsideButton = dropdownRef.current && !dropdownRef.current.contains(event.target)
      const isOutsideDropdown = dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target)
      
      if (isOutsideButton && isOutsideDropdown) {
        console.log('🔍 Click outside detected, closing dropdown')
        setShowAddDropdown(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showAddDropdown) {
        console.log('🔍 Escape key pressed, closing dropdown')
        setShowAddDropdown(false)
      }
    }

    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAddDropdown])

  // Calculate dropdown position for portal
  const getDropdownPosition = () => {
    if (!dropdownRef.current) return null
    
    const rect = dropdownRef.current.getBoundingClientRect()
    const dropdownHeight = 200 // Approximate height of dropdown menu
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    // Check if there's enough space below, if not, position above
    const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
    
    return {
      top: shouldPositionAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4, // 4px gap
      left: rect.right - 192, // 192px = w-48 (48 * 4px)
      width: 192, // w-48
      positionAbove: shouldPositionAbove
    }
  }

  const handleOptionsClick = () => {
    if (optionsButtonRef.current) {
      const rect = optionsButtonRef.current.getBoundingClientRect()
      const position = {
        top: rect.bottom + 5, // Position below the button
        right: window.innerWidth - rect.right,
        // Add additional positioning data for smart positioning
        buttonTop: rect.top,
        buttonBottom: rect.bottom,
        buttonLeft: rect.left,
        buttonRight: rect.right,
        buttonWidth: rect.width,
        buttonHeight: rect.height
      }
      onOpenOptionsMenu(position)
    }
  }

  const handleDropdownClick = () => {
    console.log('🔍 handleDropdownClick called, current showAddDropdown:', showAddDropdown)
    // Add a small delay to prevent auto-click issues
    setTimeout(() => {
      setShowAddDropdown(!showAddDropdown)
      setIsDropdownReady(false) // Reset the ready flag
      console.log('🔍 showAddDropdown set to:', !showAddDropdown)
      
      // Set the dropdown as ready after a short delay
      if (!showAddDropdown) {
        setTimeout(() => {
          setIsDropdownReady(true)
          console.log('🔍 Dropdown is now ready for interactions')
        }, 50)
      }
    }, 10)
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

        onMoveCard(cardData, tier?.id, dropPosition)
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
  // Early return if tier is completely missing
  if (!tier) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-visible relative">
        <div className="flex items-stretch min-h-[80px]">
          <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
            <span className="text-gray-500">Loading tier...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="border border-gray-300 rounded-lg overflow-visible relative"
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
                className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 relative z-10"
                title="Add tier below"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Tier label */}
          <div className={`flex items-center justify-center w-16 ${tier?.color || 'bg-gray-200'} border-r border-gray-300`}>
            <span className="text-xl font-bold text-gray-800">
              {tier?.name || 'Tier'}
            </span>
          </div>
        </div>

        {/* Main content area - Cards */}
        <div 
          className={`
            flex-1 flex items-center p-4 bg-gray-50 min-h-[80px] transition-all duration-200 overflow-visible
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
            {(tier.cards || []).map(card => (
              <Card 
                key={card.id} 
                card={card}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggedCard?.id === card.id}
                onRightClick={onCardRightClick}
                isDeletedSource={isCardFromDeletedSource ? isCardFromDeletedSource(card) : false}
              />
            ))}
            
            {/* Drop indicator in middle/end */}
            {isDragOver && (dragOverPosition === 'middle' || dragOverPosition === 'end') && (
              <div className="w-1 h-12 bg-blue-500 rounded-full animate-pulse" />
            )}
            
            {/* Add card dropdown button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🔍 Main + button clicked')
                  handleDropdownClick()
                }}
                className="w-12 h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-md flex items-center justify-center transition-colors duration-200"
                title="Add new card or import from sources (click for options)"
              >
                <span className="text-xl font-bold">+</span>
              </button>
              
              {/* Dropdown menu - rendered via portal */}
              {showAddDropdown && createPortal(
                <div 
                  ref={dropdownMenuRef}
                  className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[999999999999]"
                  style={{
                    top: getDropdownPosition()?.top || 0,
                    left: getDropdownPosition()?.left || 0,
                    width: getDropdownPosition()?.width || 192
                  }}
                >
                  {/* Dropdown arrow indicator */}
                  <div 
                    className={`absolute w-3 h-3 bg-white border-l border-t border-gray-200 transform ${
                      getDropdownPosition()?.positionAbove 
                        ? 'bottom-[-6px] left-4 rotate-45 border-r border-b' 
                        : 'top-[-6px] left-4 rotate-45 border-r border-b'
                    }`}
                  />
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!isDropdownReady) {
                          console.log('🔍 Dropdown not ready, ignoring click')
                          return
                        }
                        console.log('🔍 Create New Card button clicked')
                        onAddCard()
                        setShowAddDropdown(false)
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onFocus={(e) => e.preventDefault()}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New Card
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!isDropdownReady) {
                          console.log('🔍 Dropdown not ready, ignoring click')
                          return
                        }
                        console.log('🔍 Import Competitors button clicked')
                        onImportCards('competitors')
                        setShowAddDropdown(false)
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onFocus={(e) => e.preventDefault()}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Competitors
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!isDropdownReady) {
                          console.log('🔍 Dropdown not ready, ignoring click')
                          return
                        }
                        console.log('🔍 Import Personas button clicked')
                        onImportCards('personas')
                        setShowAddDropdown(false)
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onFocus={(e) => e.preventDefault()}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Personas
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!isDropdownReady) {
                          console.log('🔍 Dropdown not ready, ignoring click')
                          return
                        }
                        console.log('🔍 Import Pages button clicked')
                        onImportCards('pages')
                        setShowAddDropdown(false)
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onFocus={(e) => e.preventDefault()}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Pages
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Right side - Tier options */}
        <div className="flex items-center justify-center bg-gray-50 px-3 border-l border-gray-300">
          <button
            ref={optionsButtonRef}
            onClick={handleOptionsClick}
            className="w-8 h-8 text-gray-600 hover:text-gray-800 transition-colors duration-200 relative z-10"
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