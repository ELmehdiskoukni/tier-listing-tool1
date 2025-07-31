import React from 'react'
import Card from './Card'

const SourceArea = ({ 
  sourceCards, 
  onAddSourceCard, 
  onDragStart, 
  onDragEnd, 
  draggedCard,
  onCardRightClick // Make sure this prop is here
}) => {
  const sourceRows = [
    {
      id: 'competitors',
      label: 'Competitors',
      addLabel: '(Add card)',
      cards: sourceCards.competitors || []
    },
    {
      id: 'pages',
      label: 'Pages',
      addLabel: '(Add page)',
      cards: sourceCards.pages || []
    },
    {
      id: 'personas',
      label: 'Personas',
      addLabel: '(Add persona)',
      cards: sourceCards.personas || []
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Sources</h3>
      
      <div className="space-y-3">
        {sourceRows.map((row) => (
          <div key={row.id} className="border border-gray-200 rounded-lg">
            <div className="flex items-center min-h-[60px]">
              {/* Row Label */}
              <div className="flex items-center justify-center w-24 bg-gray-100 border-r border-gray-200 h-full rounded-l-lg">
                <span className="text-sm font-medium text-gray-700">
                  {row.label}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 flex items-center gap-3 p-4 bg-gray-50 min-h-[60px]">
                {/* Existing Cards */}
                {row.cards.map(card => (
                  <Card 
                    key={card.id} 
                    card={card}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    isDragging={draggedCard?.id === card.id}
                    onRightClick={onCardRightClick}
                  />
                ))}
                
                {/* Add Card Button */}
                <button
                  onClick={() => onAddSourceCard(row.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-dashed border-gray-300 hover:border-gray-400 rounded-md transition-colors duration-200"
                  title={`Add new ${row.label.toLowerCase()} card`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{row.addLabel}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SourceArea