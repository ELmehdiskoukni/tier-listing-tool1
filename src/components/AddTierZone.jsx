import React, { useState } from 'react'

const AddTierZone = ({ onAddTier, position }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleAddTier = () => {
    console.log('Add tier clicked! Position:', position) // Debug log
    onAddTier(position)
  }

  const getTooltipText = () => {
    if (position === 'top') return 'Add tier at top'
    if (position === 'bottom') return 'Add tier at bottom'
    return `Insert tier here`
  }

  return (
    <div
      className="relative h-4 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible hover zone - larger for easier hovering */}
      <div className="absolute inset-0 z-10" />
      
      {/* Visible elements */}
      <div className={`
        absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out
        ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}>
        {/* Background line that extends across the width */}
        <div className={`
          absolute inset-x-4 h-px transition-all duration-300
          ${isHovered ? 'bg-blue-400' : 'bg-gray-300'}
        `} />
        
        {/* Add button */}
        <button
          onClick={handleAddTier}
          className="
            relative z-20 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white 
            rounded-full flex items-center justify-center text-sm font-bold
            shadow-lg hover:shadow-xl transition-all duration-200 transform 
            hover:scale-110 active:scale-95
            border-2 border-white
          "
          title={getTooltipText()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Subtle glow effect */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-blue-200 rounded-full opacity-30 animate-pulse" />
          </div>
        )}
      </div>

      {/* Hover instruction text */}
      {isHovered && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-30">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {getTooltipText()}
          </div>
        </div>
      )}
    </div>
  )
}

export default AddTierZone